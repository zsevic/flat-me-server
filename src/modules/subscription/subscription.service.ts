import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { isEnvironment } from 'common/utils';
import { Filter } from 'modules/filter/filter.interface';
import { FilterRepository } from 'modules/filter/filter.repository';
import { Subscription } from 'modules/user/subscription.enum';
import { UserRepository } from 'modules/user/user.repository';
import { NotificationSubscriptionDto } from './dto';
import { NotificationSubscriptionRepository } from './notification-subscription.repository';
import { NotificationSubscription } from './notification-subscription.interface';
import { generateNotificationText } from './notification-subscription.utils';
import { NotificationSubscriptionResponseDto } from './notification-subscription-response.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly filterRepository: FilterRepository,
    private readonly notificationSubscriptionRepository: NotificationSubscriptionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async getNotificationSubscription(
    userId: string,
  ): Promise<NotificationSubscription> {
    const subscription = await this.notificationSubscriptionRepository.findOne({
      userId,
      isValid: true,
      isActive: true,
    });
    if (!subscription) return;

    return subscription;
  }

  private async handleNotificationFailure(
    response: AxiosResponse,
    subscription: NotificationSubscription,
  ): Promise<void> {
    const { results } = response.data;
    const { userId } = subscription;
    this.logger.log(`Sending push notification failed for user ${userId}`);
    if (results?.[0]?.error === 'InvalidRegistration') {
      this.logger.log(`Invalidating subscription for user ${userId}`);
      await this.notificationSubscriptionRepository.update(
        {
          token: subscription.token,
        },
        {
          isValid: false,
        },
      );
      return;
    }

    // NotRegistered error
    this.logger.error(results?.[0]?.error);
  }

  async sendNotification(
    filter: Filter,
    newApartmentsLength: number,
  ): Promise<boolean> {
    const { userId } = filter;
    const subscription = await this.getNotificationSubscription(userId);
    if (!subscription) {
      this.logger.log(`Subscription not found, unverifing user ${userId}`);
      await this.userRepository.update(
        {
          id: userId,
        },
        {
          isVerified: false,
        },
      );
      return;
    }
    const response = await this.sendPushNotification(
      subscription,
      filter.rentOrSale,
      newApartmentsLength,
    );
    if (response.data?.success === 1) {
      this.logger.log(
        `Push notification is successfully sent to user ${userId}`,
      );
      return true;
    }

    await this.handleNotificationFailure(response, subscription);
  }

  async sendPushNotification(
    subscription: NotificationSubscription,
    rentOrSale: string,
    newApartmentsLength: number,
  ) {
    const authorizationHeader = `key=${this.configService.get(
      'PUSH_NOTIFICATIONS_SERVER_KEY',
    )}`;
    const clientUrl = this.configService.get('CLIENT_URL');
    const notificationUrl = `${clientUrl}/app?tab=2&foundCounter=${newApartmentsLength}`;
    const notificationIconUrl = `${clientUrl}/icons/icon-128x128.png`;

    return axios.post(
      'https://fcm.googleapis.com/fcm/send',
      {
        notification: {
          title: 'Novi pronađeni stanovi',
          body: generateNotificationText(rentOrSale, newApartmentsLength),
          click_action: notificationUrl,
          icon: notificationIconUrl,
        },
        to: subscription.token,
      },
      {
        headers: {
          Authorization: authorizationHeader,
          'Content-Type': 'application/json',
        },
      },
    );
  }

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

  @Transactional()
  async unsubscribeFromNotifications(token: string): Promise<void> {
    const subscription = await this.notificationSubscriptionRepository.findOne({
      token,
    });
    if (!subscription) throw new UnauthorizedException('Token is not valid');

    await this.filterRepository.update(
      {
        userId: subscription.userId,
        isActive: true,
        isVerified: true,
      },
      {
        isActive: false,
      },
    );
  }

  @Transactional()
  async subscribeForNotifications(
    notificationSubscriptionDto: NotificationSubscriptionDto,
    subscriptionType = Subscription.FREE,
  ): Promise<NotificationSubscriptionResponseDto> {
    try {
      const storedNotificationSubscription = await this.notificationSubscriptionRepository.findOne(
        {
          token: notificationSubscriptionDto.token,
        },
      );
      if (!storedNotificationSubscription) {
        const newUser = await this.userRepository.save({
          isVerified: true,
          subscription: subscriptionType,
          receivedApartments: [],
        });
        await this.filterRepository.saveFilterForNotificationSubscription(
          notificationSubscriptionDto.filter,
          newUser.id,
        );
        await this.notificationSubscriptionRepository.saveSubscription(
          notificationSubscriptionDto.token,
          newUser.id,
        );
        return {
          isUpdated: false,
        };
      }

      await this.filterRepository.update(
        {
          userId: storedNotificationSubscription.userId,
        },
        {
          isActive: false,
        },
      );
      await this.filterRepository.saveFilterForNotificationSubscription(
        notificationSubscriptionDto.filter,
        storedNotificationSubscription.userId,
      );
      return {
        isUpdated: true,
      };
    } catch (error) {
      this.logger.error('Subscribing for notifications failed', error);
      throw new InternalServerErrorException(
        'Subscribing for notifications failed',
      );
    }
  }
}
