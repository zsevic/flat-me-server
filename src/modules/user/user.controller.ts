import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { USER_VERIFIED } from 'common/events/constants';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserVerifiedEvent } from './events/user-verified.event';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly eventService: EventEmitter2,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async registerUser(@Body() userDto: RegisterUserDto): Promise<void> {
    const { email } = userDto;
    const user = await this.userService.getByEmail(email);
    if (user) {
      throw new BadRequestException('User already exists');
    }

    const token = await this.tokenService.createToken();
    await this.userService.saveUser(email, token);
    await this.mailService.sendUserVerificationMail(email, token.value);
  }

  @Post('verify/:token')
  async verifyUser(@Param('token') token: string): Promise<void> {
    const user = await this.userService.verifyUser(token);

    const userVerifiedEvent = new UserVerifiedEvent();
    userVerifiedEvent.isVerified = true;
    userVerifiedEvent.email = user.email;
    this.eventService.emit(USER_VERIFIED, userVerifiedEvent);
  }
}
