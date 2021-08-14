import { HttpModule, Module } from '@nestjs/common';
import { ApartmentModule } from 'modules/apartment/apartment.module';
import { FilterModule } from 'modules/filter/filter.module';
import { MailModule } from 'modules/mail/mail.module';
import { TokenModule } from 'modules/token/token.module';
import { UserModule } from 'modules/user/user.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    ApartmentModule,
    FilterModule,
    HttpModule,
    MailModule,
    TokenModule,
    UserModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
