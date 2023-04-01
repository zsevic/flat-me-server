import { Body, Controller, Post } from '@nestjs/common';
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

  @Post()
  async subscribeByEmail(@Body() subscription: NewsletterSubscriptionDto) {
    return this.subscriptionService.subscribeByEmail(subscription.email);
  }

  @Post('notifications/subscribe')
  async subscribeForNotifications(
    @Body() notificationSubscriptionDto: NotificationSubscriptionDto,
  ): Promise<NotificationSubscriptionResponseDto> {
    return this.subscriptionService.subscribeForNotifications(
      notificationSubscriptionDto,
    );
  }

  @Post('notifications/unsubscribe')
  async unsubscribeFromNotifications(
    @Body() notificationUnsubscriptionDto: NotificationUnsubscriptionDto,
  ): Promise<void> {
    return this.subscriptionService.unsubscribeFromNotifications(
      notificationUnsubscriptionDto.token,
    );
  }
}
