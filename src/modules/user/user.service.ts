import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateToken } from 'common/utils/token-generation';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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

  async saveUser(email: string): Promise<User> {
    const token = await generateToken();
    const expiresAt = this.getExpiresAt();
    const createdUser = new this.userModel({
      _id: Types.ObjectId(),
      email,
      token: {
        expires_at: expiresAt,
        value: token,
      },
    });

    return createdUser.save();
  }

  async validateUser(email: string): Promise<void> {
    const user = await this.userModel.findOne({
      email,
    });
    if (!user) return;

    if (user?.is_verified)
      throw new BadRequestException("Can't update the filters");

    if (!user?.is_verified)
      throw new BadRequestException(
        'Email is not verified, check the verification email',
      );
  }

  async verifyUser(token: string): Promise<void> {
    const user = await this.userModel.findOne({
      'token.value': token,
      'token.expires_at': {
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
