import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterRepository } from 'modules/filter/filter.repository';
import { MailModule } from 'modules/mail/mail.module';
import { TokenModule } from 'modules/token/token.module';
import { TokenRepository } from 'modules/token/token.repository';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FilterRepository,
      TokenRepository,
      UserRepository,
    ]),
    MailModule,
    TokenModule,
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
