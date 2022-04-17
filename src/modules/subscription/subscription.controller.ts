import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  FILTER_SAVING_LIMIT,
  FILTER_SAVING_TTL,
  NOTIFICATION_SUBSCRIPTION_LIMIT,
  NOTIFICATION_SUBSCRIPTION_TTL,
} from 'common/config/rate-limiter';
import { NotificationSubscriptionDto } from './notification-subscription.dto';
import { Subscription } from './subscription.dto';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Throttle(FILTER_SAVING_LIMIT, FILTER_SAVING_TTL)
  @Post()
  async subscribeByEmail(@Body() subscription: Subscription) {
    return this.subscriptionService.subscribeByEmail(subscription.email);
  }

  @Throttle(NOTIFICATION_SUBSCRIPTION_LIMIT, NOTIFICATION_SUBSCRIPTION_TTL)
  @Post('notifications/subscribe')
  async subscribeForNotifications(
    @Body() notificationSubscriptionDto: NotificationSubscriptionDto,
  ) {
    return this.subscriptionService.subscribeForNotifications(
      notificationSubscriptionDto,
    );
  }
}
