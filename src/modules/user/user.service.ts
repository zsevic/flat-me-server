import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription } from './subscription.enum';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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

  async saveUser(email: string): Promise<User> {
    const createdUser = new this.userModel({
      _id: Types.ObjectId(),
      email,
    });

    return createdUser.save();
  }

  async validateUserFromFilter(email: string): Promise<User> {
    const user = await this.userModel.findOne({
      email,
      isVerified: true,
    });
    if (!user) return;

    if (user.subscription === Subscription.FREE) {
      throw new BadRequestException('User is already verified');
    }

    return user;
  }

  async verifyUser(id: string): Promise<User> {
    const user = await this.userModel.findOne({
      _id: id,
      isVerified: false,
    });
    if (!user) throw new BadRequestException('User verification failed');

    user.set({
      isVerified: true,
    });
    await user.save();

    return user;
  }
}
