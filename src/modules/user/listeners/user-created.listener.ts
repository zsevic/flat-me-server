import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from 'modules/mail/mail.service';
import { UserCreatedEvent } from '../events/user-created.event';

@Injectable()
export class UserCreatedListener {
  private readonly logger = new Logger(UserCreatedListener.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.created', { async: true })
  async handleUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    this.logger.log('Sending verification email...');

    await this.mailService.sendVerificationMail(event.email, event.token);
  }
}
