import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  FILTER_SAVING_LIMIT,
  FILTER_SAVING_TTL,
  NOTIFICATION_SUBSCRIPTION_LIMIT,
  NOTIFICATION_SUBSCRIPTION_TTL,
  NOTIFICATION_UNSUBSCRIPTION_LIMIT,
  NOTIFICATION_UNSUBSCRIPTION_TTL,
} from 'common/config/rate-limiter';
import { NotificationSubscriptionResponseDto } from './notification-subscription-response.dto';
import {
  NewsletterSubscriptionDto,
  NotificationSubscriptionDto,
  NotificationUnsubscriptionDto,
} from './dto';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Throttle(FILTER_SAVING_LIMIT, FILTER_SAVING_TTL)
  @Post()
  async subscribeByEmail(@Body() subscription: NewsletterSubscriptionDto) {
    return this.subscriptionService.subscribeByEmail(subscription.email);
  }

  @Throttle(NOTIFICATION_SUBSCRIPTION_LIMIT, NOTIFICATION_SUBSCRIPTION_TTL)
  @Post('notifications/subscribe')
  async subscribeForNotifications(
    @Body() notificationSubscriptionDto: NotificationSubscriptionDto,
  ): Promise<NotificationSubscriptionResponseDto> {
    return this.subscriptionService.subscribeForNotifications(
      notificationSubscriptionDto,
    );
  }

  @Throttle(NOTIFICATION_UNSUBSCRIPTION_LIMIT, NOTIFICATION_UNSUBSCRIPTION_TTL)
  @Post('notifications/unsubscribe')
  async unsubscribeFromNotifications(
    @Body() notificationUnsubscriptionDto: NotificationUnsubscriptionDto,
  ): Promise<void> {
    return this.subscriptionService.unsubscribeFromNotifications(
      notificationUnsubscriptionDto.token,
    );
  }
}
