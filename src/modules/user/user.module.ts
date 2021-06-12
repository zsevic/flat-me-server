import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from 'modules/mail/mail.module';
import { UserCreatedListener } from './listeners/user-created.listener';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailModule,
  ],
  providers: [UserService, UserCreatedListener],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
