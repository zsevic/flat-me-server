import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async addFilter(userId: string, filterId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      $push: {
        filters: filterId,
      },
    });
  }

  async getById(id: string): Promise<UserDocument> {
    return this.userModel.findById(id);
  }

  async getByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }

  async getReceivedApartmentsIds(userId: string): Promise<string[]> {
    const user = await this.userModel
      .findById(userId)
      .select('receivedApartments');

    if (!user) return [];

    return user.receivedApartments;
  }

  async insertReceivedApartmentsIds(
    userId: string,
    apartmentsIds: Types._ObjectId[],
  ) {
    return this.userModel.findByIdAndUpdate(userId, {
      $push: {
        receivedApartments: { $each: apartmentsIds },
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

  async verifyUser(user: UserDocument): Promise<void> {
    user.set({
      isVerified: true,
    });

    await user.save();
  }
}
