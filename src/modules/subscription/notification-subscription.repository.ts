import { Injectable } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { NotificationSubscription } from './notification-subscription.class';
import { NotificationSubscriptionEntity } from './notification-subscription.entity';

@Injectable()
@EntityRepository(NotificationSubscriptionEntity)
export class NotificationSubscriptionRepository extends Repository<
  NotificationSubscriptionEntity
> {
  async subscriptionExists(
    subscription: NotificationSubscription,
  ): Promise<boolean> {
    const foundSubscription = await this.findOne({ subscription });
    if (foundSubscription) return true;

    return false;
  }

  async saveSubscription(
    subscription: NotificationSubscription,
    userId: string,
  ): Promise<void> {
    await this.save({
      subscription,
      userId,
      isValid: true,
    });
  }
}
