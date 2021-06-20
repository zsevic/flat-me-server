import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { getTestMessageUrl } from 'nodemailer';
import { isEnvironment } from 'common/utils';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendUpdatesMail(email: string): Promise<void> {
    this.logger.log(`Sending updates to ${email}...`);
  }

  async sendVerificationMail(email: string, token: string): Promise<void> {
    const url = `https://flat-me.herokuapp.com/users/verify/${token}`; // TODO replace with client url

    const mailInfo = await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to FlatMe! Confirm your email',
      template: './confirmation',
      context: {
        url,
      },
    });

    if (!isEnvironment('production')) {
      this.logger.log(`Mail preview URL: ${getTestMessageUrl(mailInfo)}`);
    } else {
      this.logger.log('Mail is sent');
    }
  }
}
