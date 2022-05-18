import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSubscriptionRepository } from 'modules/subscription/notification-subscription.repository';
import { UserRepository } from 'modules/user/user.repository';
import { ApartmentController } from './apartment.controller';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentService } from './apartment.service';
import { BaseProvider } from './providers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApartmentRepository,
      NotificationSubscriptionRepository,
      UserRepository,
    ]),
  ],
  providers: [ApartmentService, BaseProvider],
  controllers: [ApartmentController],
  exports: [ApartmentService],
})
export class ApartmentModule {}
