import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { getTestMessageUrl } from 'nodemailer';
import { isEnvironment } from 'common/utils';
import { Apartment } from 'modules/apartment/apartment.interface';
import { localizeApartment } from 'modules/apartment/apartment.utils';
import { FilterDto } from 'modules/filter/dto/filter.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  private getMailSubjectForNewApartments = (
    filter: FilterDto,
    apartmentListLength: number,
  ): string => {
    const rentOrSale =
      filter.rentOrSale === 'rent' ? 'iznajmljivanje' : 'kupovinu';
    const projectName = 'FlatMe';
    if (apartmentListLength === 1)
      return `[${projectName}] 1 novi stan za ${rentOrSale}`;
    if (apartmentListLength <= 4)
      return `[${projectName}] ${apartmentListLength} nova stana za ${rentOrSale}`;
    return `[${projectName}] ${apartmentListLength} novih stanova za ${rentOrSale}`;
  };

  async sendFilterVerificationMail(
    email: string,
    token: string,
  ): Promise<void> {
    const url = `${process.env.CLIENT_URL}/filters/verification/${token}`;
    this.logger.log(`verification url: ${url}`);

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
      this.logger.log(`Mail is sent to ${email}`);
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
      subject: this.getMailSubjectForNewApartments(
        filter,
        apartmentList.length,
      ),
      template:
        apartmentList.length > 1 ? './new-apartments' : './one-new-apartment',
      context: {
        apartmentList: apartmentList.map(localizeApartment),
        apartment: localizeApartment(apartmentList[0]),
        deactivationUrl,
      },
    });

    if (!isEnvironment('production')) {
      this.logger.log(`Mail preview URL: ${getTestMessageUrl(mailInfo)}`);
    } else {
      this.logger.log(`Mail is sent to ${email}`);
    }
  }
}
