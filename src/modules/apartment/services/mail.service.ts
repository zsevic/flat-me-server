import { getLocation } from 'common/utils/location';
import { FiltersDto } from '../dto/filters.dto';

export class MailService {
  private renderApartmentInfo = (apartmentInfo): string => {
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
    const createdAt = apartmentInfo.createdAt
      ? `created at: ${new Date(apartmentInfo.createdAt).toDateString()} `
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

  private getMailHeader = (
    filters: FiltersDto,
    apartmentListLength: number,
  ): string =>
    `Here is the list with ${apartmentListLength} apartment(s) for ${filters.rentOrSale}`;

  private renderHtmlApartmentInfo = apartmentInfo => {
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

  getApartmentListHtmlTemplate = (
    apartmentList,
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

  private renderTextApartmentInfo = apartmentInfo =>
    this.renderApartmentInfo(apartmentInfo);

  private getApartmentListTextTemplate = (
    apartmentList,
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

  private getMailSubject = (
    filters: FiltersDto,
    apartmentListLength: number,
  ): string =>
    `Found ${apartmentListLength} new apartment(s) for ${filters.rentOrSale}`;

  public getMailData = (apartmentList: any, filters: FiltersDto): any => ({
    from: 'zeljko@sevic.dev',
    html: this.getApartmentListHtmlTemplate(apartmentList, filters),
    subject: this.getMailSubject(filters, apartmentList.length),
    text: this.getApartmentListTextTemplate(apartmentList, filters),
    to: 'zeljkosevic95@gmail.com',
  });
}
