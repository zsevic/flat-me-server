import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { isEnvironment } from 'common/utils';
import { FilterRepository } from 'modules/filter/filter.repository';
import { Subscription } from 'modules/user/subscription.enum';
import { UserRepository } from 'modules/user/user.repository';
import { NotificationSubscriptionDto } from './notification-subscription.dto';
import { NotificationSubscriptionRepository } from './notification-subscription.repository';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly filterRepository: FilterRepository,
    private readonly notificationSubscriptionRepository: NotificationSubscriptionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async subscribeByEmail(email: string) {
    try {
      if (!isEnvironment('production')) return;

      await axios({
        url: 'https://api.sendgrid.com/v3/marketing/contacts',
        method: 'PUT',
        headers: {
          authorization: `Bearer ${this.configService.get('SENDGRID_API_KEY')}`,
        },
        data: {
          contacts: [
            {
              email,
            },
          ],
          list_ids: [this.configService.get('SENDGRID_MAILING_ID')],
        },
      });
    } catch (error) {
      this.logger.error(`Subscribing user with email ${email} failed`, error);
      throw new ConflictException();
    }
  }

  async subscribeForNotifications(
    notificationSubscriptionDto: NotificationSubscriptionDto,
    subscriptionType = Subscription.FREE,
  ): Promise<void> {
    try {
      const storedNotificationSubscription = await this.notificationSubscriptionRepository.findOne({
        subscription: notificationSubscriptionDto.subscription,
      });
      if (!storedNotificationSubscription) {
        const newUser = await this.userRepository.save({
          isVerified: true,
          subscription: subscriptionType,
          receivedApartments: [],
        });
        await this.filterRepository.saveFilterForNotificationSubscription(
          notificationSubscriptionDto,
          newUser.id,
        );
        await this.notificationSubscriptionRepository.save({
          userId: newUser.id,
          subscription: notificationSubscriptionDto.subscription,
        });
        return;
      }

      await this.filterRepository.saveFilterForNotificationSubscription(
        notificationSubscriptionDto,
        storedNotificationSubscription.userId,
      );
    } catch (error) {
      this.logger.error(`Subscribing for notifications failed`, error);
      throw new ConflictException();
    }
  }
}
