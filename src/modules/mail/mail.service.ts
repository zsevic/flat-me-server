import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Apartment } from 'modules/apartment/apartment.interface';
import { localizeApartment } from 'modules/apartment/apartment.utils';
import { FilterDto } from 'modules/filter/dto/filter.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  private getMailSubjectForNewApartments = (
    filter: FilterDto,
    apartmentListLength: number,
  ): string => {
    const rentOrSale =
      filter.rentOrSale === 'rent' ? 'iznajmljivanje' : 'kupovinu';
    if (apartmentListLength === 1) return `1 novi stan za ${rentOrSale}`;
    if (apartmentListLength <= 4)
      return `${apartmentListLength} nova stana za ${rentOrSale}`;
    return `${apartmentListLength} novih stanova za ${rentOrSale}`;
  };

  async sendFilterVerificationMail(
    email: string,
    token: string,
  ): Promise<void> {
    const url = `${this.configService.get(
      'CLIENT_URL',
    )}/filters/verification/${token}`;
    this.logger.log(`verification url: ${url}`);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Potvrda pretrage',
      template: './filter-verification',
      context: {
        url,
      },
    });

    this.logger.log(`Mail is sent to ${email}`);
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
    await this.mailerService.sendMail({
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
        clientUrl: this.configService.get('CLIENT_URL'),
      },
    });

    this.logger.log(`Mail is sent to ${email}`);
  }
}
