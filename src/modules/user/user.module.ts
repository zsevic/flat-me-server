import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from 'modules/mail/mail.module';
import { TokenModule } from 'modules/token/token.module';
import { UserRepository } from './user.repository';
import { User, UserSchema } from './user.schema';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailModule,
    TokenModule,
  ],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
