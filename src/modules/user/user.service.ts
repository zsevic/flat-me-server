import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async saveUser(email: string): Promise<User> {
    const createdUser = new this.userModel({
      _id: Types.ObjectId(),
      email,
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
}
