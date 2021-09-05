import { BadRequestException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { User } from './user.interface';

@EntityRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
  async addFilter(userId: string, filterId: string) {
    const user = await this.findOne({ _id: userId });
    if (!user) {
      // TODO
    }

    user.filters.push(filterId);

    return this.save(user);
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

  async saveUser(email: string): Promise<User> {
    return this.save({ email });
  }

  async verifyUser(user: User): Promise<void> {
    await this.save({
      ...user,
      isVerified: true,
    });
  }
}
