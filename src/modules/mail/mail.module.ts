import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<MailerOptions> => {
        const transport = {
          auth: {
            pass: configService.get('EMAIL_PASSWORD'),
            user: configService.get('EMAIL_USERNAME'),
          },
          host: configService.get('EMAIL_HOST'),
          port: configService.get('EMAIL_PORT'),
          secure: configService.get('EMAIL_SECURE'),
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
