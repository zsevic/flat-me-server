import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'modules/mail/mail.module';
import { TokenModule } from 'modules/token/token.module';
import { UserModule } from 'modules/user/user.module';
import { FilterController } from './filter.controller';
import { FilterRepository } from './filter.repository';
import { FilterService } from './filter.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FilterRepository]),
    MailModule,
    TokenModule,
    UserModule,
  ],
  controllers: [FilterController],
  providers: [FilterService],
  exports: [FilterService],
})
export class FilterModule {}
