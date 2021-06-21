import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { getTestMessageUrl } from 'nodemailer';
import { isEnvironment } from 'common/utils';
import { getLocation } from 'common/utils/location';
import { ApartmentDocument } from 'modules/apartment/apartment.schema';
import { FiltersDto } from 'modules/filter/dto/filters.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  getApartmentListHtmlTemplate = (
    apartmentList: ApartmentDocument[],
    filters: FiltersDto,
  ): string => {
    const renderedApartmentList = apartmentList
      .sort(
        (firstApartment, secondApartment) =>
          firstApartment.price - secondApartment.price,
      )
      .reduce(
        (acc, currentApartmentInfo) =>
          `${acc}<li>${this.renderHtmlApartmentInfo(currentApartmentInfo)}`,
        '',
      );
    return `<div>${this.getMailHeader(
      filters,
      apartmentList.length,
    )}</div><ul>${renderedApartmentList}</li>`;
  };

  private getApartmentListTextTemplate = (
    apartmentList: ApartmentDocument[],
    filters: FiltersDto,
  ): string => {
    const renderedApartmentList = apartmentList
      .sort(
        (firstApartment, secondApartment) =>
          firstApartment.price - secondApartment.price,
      )
      .reduce(
        (acc, currentApartmentInfo) =>
          `${acc}- ${this.renderTextApartmentInfo(currentApartmentInfo)}\n`,
        '',
      );
    return `${this.getMailHeader(
      filters,
      apartmentList.length,
    )}\n${renderedApartmentList}`;
  };

  private getMailHeader = (
    filters: FiltersDto,
    apartmentListLength: number,
  ): string =>
    `Here is the list with ${apartmentListLength} apartment(s) for ${filters.rentOrSale}`;

  private getMailSubject = (
    filters: FiltersDto,
    apartmentListLength: number,
  ): string =>
    `Found ${apartmentListLength} new apartment(s) for ${filters.rentOrSale}`;

  private renderApartmentInfo = (apartmentInfo: ApartmentDocument): string => {
    const priceInfo = `price: ${apartmentInfo.price}EUR, `;
    const structureInfo = `structure: ${apartmentInfo.structure} room(s), `;
    const addressInfo = apartmentInfo.address
      ? `address: ${apartmentInfo.address}, `
      : '';
    const placeInfo = apartmentInfo.place
      ? apartmentInfo.address
        ? `${apartmentInfo.place}, `
        : `place: ${apartmentInfo.place}, `
      : '';
    const floorInfo = apartmentInfo.floor
      ? `floor: ${apartmentInfo.floor}, `
      : '';
    const isFurnished = apartmentInfo.isFurnished ? 'furnished, ' : '';
    const heatingType = apartmentInfo.heatingType
      ? `heating type: ${apartmentInfo.heatingType}, `
      : '';
    const sizeInfo = `size: ${apartmentInfo.size}m2, `;
    const createdAt = apartmentInfo.postedAt
      ? `posted at: ${new Date(apartmentInfo.postedAt).toDateString()} `
      : '';
    const availableFrom = apartmentInfo.availableFrom
      ? `available from: ${
          new Date(apartmentInfo.availableFrom) < new Date()
            ? 'now'
            : new Date(apartmentInfo.availableFrom).toDateString()
        }`
      : '';

    return (
      priceInfo +
      structureInfo +
      addressInfo +
      placeInfo +
      floorInfo +
      isFurnished +
      heatingType +
      sizeInfo +
      createdAt +
      availableFrom
    );
  };

  private renderHtmlApartmentInfo = (
    apartmentInfo: ApartmentDocument,
  ): string => {
    const locationInfo = apartmentInfo?.location
      ? ` <a href="${getLocation(apartmentInfo.location)}">location</a>`
      : '';
    const apartmentInfoUrl = apartmentInfo?.url
      ? ` <a href="${apartmentInfo.url}">url</a>`
      : '';

    return (
      this.renderApartmentInfo(apartmentInfo) + locationInfo + apartmentInfoUrl
    );
  };

  private renderTextApartmentInfo = apartmentInfo =>
    this.renderApartmentInfo(apartmentInfo);

  async sendUpdatesMail(
    email: string,
    apartmentList: ApartmentDocument[],
    filters: FiltersDto,
  ): Promise<void> {
    this.logger.log(
      `Sending ${apartmentList.length} new apartment(s) to ${email}...`,
    );
    console.log('aplist', apartmentList);

    const mailInfo = await this.mailerService.sendMail({
      to: email,
      // html: this.getApartmentListHtmlTemplate(apartmentList, filters),
      subject: this.getMailSubject(filters, apartmentList.length),
      // text: this.getApartmentListTextTemplate(apartmentList, filters),
      template: './updates',
      context: {
        apartmentList,
        filters,
      },
    });

    if (!isEnvironment('production')) {
      this.logger.log(`Mail preview URL: ${getTestMessageUrl(mailInfo)}`);
    } else {
      this.logger.log('Mail is sent');
    }
  }

  async sendVerificationMail(email: string, token: string): Promise<void> {
    const url = `https://flat-me.herokuapp.com/users/verify/${token}`; // TODO replace with client url

    const mailInfo = await this.mailerService.sendMail({
      to: email,
      subject: 'Dobrodošli na FlatMe, potvrda mejl adrese',
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
