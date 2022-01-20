import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  FILTER_SAVING_LIMIT,
  FILTER_SAVING_TTL,
} from 'common/config/rate-limiter';
import { Subscription } from './subscription.dto';

@Controller('subscriptions')
export class SubscriptionController {
  @Throttle(FILTER_SAVING_LIMIT, FILTER_SAVING_TTL)
  @Post()
  subscribeByEmail(@Body() subscription: Subscription) {
    return;
  }
}
