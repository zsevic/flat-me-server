import { Body, Controller, Post } from '@nestjs/common';
import { Subscription } from './subscription.dto';

@Controller('subscriptions')
export class SubscriptionController {
  @Post()
  subscribeByEmail(@Body() subscription: Subscription) {
    return;
  }
}
