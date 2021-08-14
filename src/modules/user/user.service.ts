import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Subscription } from './subscription.enum';
import { UserRepository } from './user.repository';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getById(id: string): Promise<User> {
    return this.userRepository.getById(id);
  }

  async getReceivedApartmentsIds(userId: string): Promise<string[]> {
    return this.userRepository.getReceivedApartmentsIds(userId);
  }

  async getVerifiedUserByEmailAndValidateFilters(
    email: string,
  ): Promise<UserDocument> {
    const user = await this.userRepository.getVerifiedUserByEmail(email);
    if (!user) return;

    if (user.subscription !== Subscription.FREE) return;

    if (user.filters.length > 1) {
      throw new BadRequestException(
        `Filter limit is filled for ${Subscription.FREE} subscription`,
      );
    }

    return user;
  }

  async insertReceivedApartmentsIds(
    userId: string,
    apartmentsIds: Types._ObjectId[],
  ) {
    return this.userRepository.insertReceivedApartmentsIds(
      userId,
      apartmentsIds,
    );
  }

  async saveUser(email: string): Promise<UserDocument> {
    return this.userRepository.saveUser(email);
  }

  async saveFilter(user: UserDocument, filterId: string): Promise<void> {
    user.filters.push(filterId);

    await user.save();
  }

  async verifyUser(id: string): Promise<UserDocument> {
    const user = await this.userRepository.getById(id);
    if (!user) throw new BadRequestException('User is not found');

    if (user.isVerified) return user;

    await this.userRepository.verifyUser(user);
    return user;
  }
}
