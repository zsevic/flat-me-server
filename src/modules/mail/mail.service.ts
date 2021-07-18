import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { getTestMessageUrl } from 'nodemailer';
import { isEnvironment } from 'common/utils';
import { getLocationUrl } from 'common/utils/location';
import { ApartmentDocument } from 'modules/apartment/apartment.schema';
import { FilterDto } from 'modules/filter/dto/filter.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  private getMailSubject = (
    filter: FilterDto,
    apartmentListLength: number,
  ): string =>
    `Found ${apartmentListLength} new apartment(s) for ${filter.rentOrSale}`;

  async sendFilterVerificationMail(
    email: string,
    token: string,
  ): Promise<void> {
    const url = `${process.env.CLIENT_URL}/filters/verification/${token}`;
    console.log('verfilurl', url);

    const mailInfo = await this.mailerService.sendMail({
      to: email,
      subject: 'Potvrda pretrage',
      template: './filter-verification',
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

  async sendUpdatesMail(
    email: string,
    apartmentList: ApartmentDocument[],
    filter: FilterDto,
  ): Promise<void> {
    this.logger.log(
      `Sending ${apartmentList.length} new apartment(s) to ${email}...`,
    );
    const mailInfo = await this.mailerService.sendMail({
      to: email,
      subject: this.getMailSubject(filter, apartmentList.length),
      template: './new-apartments',
      context: {
        apartmentList: apartmentList.map(apartment =>
          Object.assign(apartment, {
            locationUrl: getLocationUrl(apartment?.location),
          }),
        ),
        filter,
        name: 'user',
      },
    });

    if (!isEnvironment('production')) {
      this.logger.log(`Mail preview URL: ${getTestMessageUrl(mailInfo)}`);
    } else {
      this.logger.log('Mail is sent');
    }
  }

  async sendUserVerificationMail(email: string, token: string): Promise<void> {
    const url = `${process.env.CLIENT_URL}/users/verification/${token}`;
    console.log('verurl', url);

    const mailInfo = await this.mailerService.sendMail({
      to: email,
      subject: 'Dobrodošli na FlatMe, potvrda mejl adrese',
      template: './user-verification',
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
