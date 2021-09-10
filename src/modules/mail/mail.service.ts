import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { getTestMessageUrl } from 'nodemailer';
import { isEnvironment } from 'common/utils';
import { getLocationUrl } from 'common/utils/location';
import { Apartment } from 'modules/apartment/apartment.interface';
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

  async sendMailWithNewApartments(
    email: string,
    apartmentList: Apartment[],
    filter: FilterDto,
    deactivationUrl: string,
  ): Promise<void> {
    this.logger.log(
      `Sending ${apartmentList.length} new apartment(s) to ${email}...`,
    );
    const mailInfo = await this.mailerService.sendMail({
      to: email,
      subject: this.getMailSubject(filter, apartmentList.length),
      template: './new-apartments',
      context: {
        apartmentList: apartmentList.map(apartment => ({
          ...apartment,
          ...(apartment.location && {
            locationUrl: getLocationUrl(apartment.location),
          }),
        })),
        filter,
        name: 'user',
        deactivationUrl,
      },
    });

    if (!isEnvironment('production')) {
      this.logger.log(`Mail preview URL: ${getTestMessageUrl(mailInfo)}`);
    } else {
      this.logger.log('Mail is sent');
    }
  }
}
