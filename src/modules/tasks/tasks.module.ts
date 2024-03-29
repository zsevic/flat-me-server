import { Module } from '@nestjs/common';
import { ApartmentModule } from 'modules/apartment/apartment.module';
import { FilterModule } from 'modules/filter/filter.module';
import { MailModule } from 'modules/mail/mail.module';
import { SubscriptionModule } from 'modules/subscription/subscription.module';
import { TokenModule } from 'modules/token/token.module';
import { UserModule } from 'modules/user/user.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    ApartmentModule,
    FilterModule,
    MailModule,
    TokenModule,
    SubscriptionModule,
    UserModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
