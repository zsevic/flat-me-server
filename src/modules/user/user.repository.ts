import { Injectable } from '@nestjs/common';
import { Apartment } from 'modules/apartment/apartment.interface';
import { EntityRepository, Repository } from 'typeorm';
import { Subscription } from './subscription.enum';
import { UserEntity } from './user.entity';
import { User } from './user.interface';

@Injectable()
@EntityRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
  async getById(id: string): Promise<User> {
    return this.findOne({ id });
  }

  async getByEmail(email: string): Promise<User> {
    return this.findOne({ where: { email }, relations: ['filters'] });
  }

  async getUserEmail(userId: string): Promise<string> {
    const user = await this.getById(userId);
    if (!user) throw new Error('User is not valid');

    return user.email;
  }

  async insertReceivedApartments(userId: string, apartments: Apartment[]) {
    const user = await this.findOne({
      where: { id: userId },
      relations: ['apartments'],
    });
    if (!user) return;

    return this.save({
      ...user,
      apartments: [...user.apartments, ...apartments],
    });
  }

  async saveUser(
    email: string,
    subscription = Subscription.FREE,
  ): Promise<User> {
    return this.save({
      email,
      isVerified: false,
      subscription,
      receivedApartments: [],
    });
  }

  async verifyUser(user: User): Promise<void> {
    await this.save({
      ...user,
      isVerified: true,
    });
  }
}
