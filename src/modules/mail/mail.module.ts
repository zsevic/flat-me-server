import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { createTestAccount } from 'nodemailer';
import { isEnvironment } from 'common/utils';
import { promisify } from 'util';
import { MailService } from './mail.service';

const createTestAccountAsync = promisify(createTestAccount);

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<MailerOptions> => {
        const transport = !isEnvironment('production')
          ? {
              auth: {
                pass: configService.get('FAKE_EMAIL_PASSWORD'),
                user: configService.get('FAKE_EMAIL_USERNAME'),
              },
              host: 'smtp.mailtrap.io',
              port: 2525,
            }
          : {
              auth: {
                user: 'apikey',
                pass: configService.get('SENDGRID_API_KEY'),
              },
              host: 'smtp.sendgrid.net',
              port: 465,
              secure: true,
            };

        return {
          transport,
          defaults: {
            from: {
              name: 'FlatMe',
              address: 'info@flat-me.com',
            },
          },
          template: {
            dir: path.join(process.cwd(), 'dist/assets/mail-templates'),
            adapter: new PugAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
