import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  FILTER_SAVING_LIMIT,
  FILTER_SAVING_TTL,
} from 'common/config/rate-limiter';
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
}
