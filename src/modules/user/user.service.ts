import { BadRequestException, Injectable } from '@nestjs/common';
import { ApartmentDocument } from 'modules/apartment/apartment.schema';
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

  async getUserEmail(userId: string): Promise<string> {
    return this.userRepository.getUserEmail(userId);
  }

  async getVerifiedUserByEmailAndValidateFilters(email: string): Promise<User> {
    const user = await this.userRepository.getByEmail(email);
    if (!user) return;

    if (!user.isVerified) {
      throw new BadRequestException('User is not verified');
    }

    if (user.subscription !== Subscription.FREE) return;

    if (user.filters.length >= 1) {
      throw new BadRequestException(
        `Filter limit is already filled for ${Subscription.FREE} subscription`,
      );
    }

    return user;
  }

  async insertReceivedApartmentsIds(
    userId: string,
    apartments: ApartmentDocument[],
  ) {
    const apartmentsIds = apartments.map(apartment => apartment._id);

    return this.userRepository.insertReceivedApartmentsIds(
      userId,
      apartmentsIds,
    );
  }

  async saveUser(email: string): Promise<User> {
    return this.userRepository.saveUser(email);
  }

  async saveFilter(userId: string, filterId: string) {
    return this.userRepository.addFilter(userId, filterId);
  }

  async verifyUser(id: string): Promise<UserDocument> {
    const user = await this.userRepository.getById(id);
    if (!user) throw new BadRequestException('User is not found');

    if (user.isVerified) return user;

    await this.userRepository.verifyUser(user);
    return user;
  }
}
