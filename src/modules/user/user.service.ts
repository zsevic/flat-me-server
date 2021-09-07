import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Apartment } from 'modules/apartment/apartment.interface';
import { Subscription } from './subscription.enum';
import { User } from './user.interface';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async getById(id: string): Promise<User> {
    return this.userRepository.getById(id);
  }

  async getVerifiedUserOrCreateNewUser(email: string): Promise<User> {
    const user = await this.getVerifiedUserByEmailAndValidateFilters(email);
    if (!user) return this.saveUser(email);

    return user;
  }

  async getUserEmail(userId: string): Promise<string> {
    return this.userRepository.getUserEmail(userId);
  }

  private async getVerifiedUserByEmailAndValidateFilters(
    email: string,
  ): Promise<User> {
    const user = await this.userRepository.getByEmail(email);
    if (!user) return;

    if (!user.isVerified) {
      throw new BadRequestException('User is not verified');
    }

    if (user.subscription !== Subscription.FREE) {
      throw new BadRequestException(
        `Subscription ${user.subscription} is not allowed`,
      );
    }

    if (user.filters.length >= 1) {
      throw new BadRequestException(
        `Filter limit is already filled for ${Subscription.FREE} subscription`,
      );
    }

    return user;
  }

  async insertReceivedApartmentsIds(userId: string, apartments: Apartment[]) {
    return this.userRepository.insertReceivedApartmentsIds(userId, apartments);
  }

  async saveUser(email: string): Promise<User> {
    return this.userRepository.saveUser(email);
  }

  async verifyUser(id: string): Promise<void> {
    const user = await this.userRepository.getById(id);
    if (!user) throw new BadRequestException('User is not found');

    if (user.isVerified) return;

    await this.userRepository.verifyUser(user);
  }
}
