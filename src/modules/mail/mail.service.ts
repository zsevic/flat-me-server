import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { getTestMessageUrl } from 'nodemailer';
import { isEnvironment } from 'common/utils';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationMail(email: string, token: string): Promise<void> {
    const url = `http://172.19.241.201:8080/users/verify/${token}`;

    const mailInfo = await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to FlatMe! Confirm your email',
      template: './confirmation',
      context: {
        url,
      },
    });

    if (!isEnvironment('production')) {
      console.log(`Mail preview URL: ${getTestMessageUrl(mailInfo)}`);
    } else {
      console.log('Mail is sent');
    }
  }
}
