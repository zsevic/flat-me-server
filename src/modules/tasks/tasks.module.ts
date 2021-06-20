import { Module } from '@nestjs/common';
import { ApartmentModule } from 'modules/apartment/apartment.module';
import { FilterModule } from 'modules/filter/filter.module';
import { MailModule } from 'modules/mail/mail.module';
import { UserModule } from 'modules/user/user.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [ApartmentModule, FilterModule, MailModule, UserModule],
  providers: [TasksService],
})
export class TasksModule {}
