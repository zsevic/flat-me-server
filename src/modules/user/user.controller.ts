import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailService } from 'modules/mail/mail.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserVerifiedEvent } from './events/user-verified.event';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly eventService: EventEmitter2,
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async registerUser(@Body() user: RegisterUserDto): Promise<void> {
    const { email } = user;
    const token = await this.userService.createToken();
    await this.userService.saveUser(email, token);
    await this.mailService.sendVerificationMail(email, token.value);
  }

  @Post('verify/:token')
  async verifyUser(@Param('token') token: string): Promise<void> {
    await this.userService.verifyUser(token);

    const userVerifiedEvent = new UserVerifiedEvent();
    userVerifiedEvent.isVerified = true;
    this.eventService.emit('user.verified', userVerifiedEvent);
  }
}
