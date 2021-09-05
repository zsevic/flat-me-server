import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityRepository, MongoRepository } from 'typeorm';
import { Subscription } from './subscription.enum';
import { UserEntity } from './user.entity';
import { User } from './user.interface';

@Injectable()
@EntityRepository(UserEntity)
export class UserRepository extends MongoRepository<UserEntity> {
  async addFilter(userId: string, filterId: string) {
    const user = await this.findOne({ _id: userId });
    if (!user) {
      // TODO
    }

    return this.save({
      ...user,
      filters: [...user.filters, filterId],
    });
  }

  async getById(id: string): Promise<User> {
    return this.findOne({ _id: id });
  }

  async getByEmail(email: string): Promise<User> {
    return this.findOne({ email });
  }

  async getReceivedApartmentsIds(userId: string): Promise<string[]> {
    const user = await this.findOne({
      where: { _id: userId },
      select: ['receivedApartments'],
    });

    if (!user) return [];

    return user.receivedApartments;
  }

  async getUserEmail(userId: string): Promise<string> {
    const user = await this.getById(userId);
    if (!user) throw new BadRequestException('User is not valid');

    return user.email;
  }

  async insertReceivedApartmentsIds(userId: string, apartmentsIds: string[]) {
    const user = await this.findOne({ _id: userId });
    if (!user) {
      // TODO
    }

    return this.save({
      ...user,
      receivedApartments: [...user.receivedApartments, ...apartmentsIds],
    });
  }

  async saveUser(
    email: string,
    subscription = Subscription.FREE,
  ): Promise<User> {
    return this.save({
      email,
      subscription,
      filters: [],
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
