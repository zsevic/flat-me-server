import { Injectable } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { NotificationSubscriptionEntity } from './notification-subscription.entity';

@Injectable()
@EntityRepository(NotificationSubscriptionEntity)
export class NotificationSubscriptionRepository extends Repository<
  NotificationSubscriptionEntity
> {
  async saveSubscription(token: string, userId: string): Promise<void> {
    await this.save({
      token,
      userId,
      isValid: true,
    });
  }
}
