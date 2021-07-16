import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Token } from 'modules/token/token.interface';
import { TokenService } from 'modules/token/token.service';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    private readonly tokenService: TokenService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getById(id: string) {
    return this.userModel.findById(id);
  }

  async getByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

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

    if (!user?.isVerified)
      throw new BadRequestException(
        'Email is not verified, check the verification email',
      );

    return user;
  }

  async verifyUser(token: string): Promise<User> {
    const user = await this.userModel.findOne({
      'token.value': token,
      'token.expiresAt': {
        $gt: new Date(),
      },
      isVerified: false,
    });
    if (!user) throw new BadRequestException('Token is not valid');

    user.set({
      isVerified: true,
      token: null,
    });
    await user.save();

    return user;
  }
}
