import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterRepository } from 'modules/filter/filter.repository';
import { UserRepository } from 'modules/user/user.repository';
import { NotificationSubscriptionRepository } from './notification-subscription.repository';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FilterRepository,
      NotificationSubscriptionRepository,
      UserRepository,
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
