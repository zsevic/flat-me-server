import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateToken } from 'common/utils/token-generation';
import { Model, Types } from 'mongoose';
import { Token } from './token.interface';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createToken(): Promise<Token> {
    const token = await generateToken();
    const expiresAt = this.getExpiresAt();

    return {
      expiresAt,
      value: token,
    };
  }

  async getByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  private getExpiresAt = (): Date => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    return expiresAt;
  };

  async getReceivedApartmentIds(userId: string) {
    return this.userModel.findById(userId).select('receivedApartments');
  }

  async insertReceivedApartmentIds(
    userId: string,
    apartmentIds: Types._ObjectId[],
  ) {
    return this.userModel.findByIdAndUpdate(userId, {
      $push: {
        receivedApartments: { $each: apartmentIds },
      },
    });
  }

  async saveUser(email: string, token: Token): Promise<User> {
    const createdUser = new this.userModel({
      _id: Types.ObjectId(),
      email,
      token,
    });

    return createdUser.save();
  }

  async validateAndGetByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({
      email,
    });
    if (!user) throw new BadRequestException('User is not found');

    if (!user?.is_verified)
      throw new BadRequestException(
        'Email is not verified, check the verification email',
      );

    return user;
  }

  async verifyUser(token: string): Promise<void> {
    const user = await this.userModel.findOne({
      'token.value': token,
      'token.expiresAt': {
        $gt: new Date(),
      },
      is_verified: false,
    });
    if (!user) throw new BadRequestException('Token is not valid');

    user.set({
      is_verified: true,
      token: null,
    });
    await user.save();
  }
}
