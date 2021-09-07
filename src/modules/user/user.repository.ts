import { BadRequestException, Injectable } from '@nestjs/common';
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

  async getReceivedApartmentsIds(userId: string): Promise<string[]> {
    const user = await this.findOne({
      where: { id: userId },
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
    const user = await this.findOne({ id: userId });
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
