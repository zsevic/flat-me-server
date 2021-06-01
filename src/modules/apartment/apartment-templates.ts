import { getLocation } from 'common/utils/location';

function renderApartmentInfo(apartmentInfo): string {
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
}

function getMailHeader(filters, apartmentListLength: number): string {
  return `Here is the list with ${apartmentListLength} apartment(s) for ${filters.RENT_OR_SALE}`;
}

function renderHtmlApartmentInfo(apartmentInfo) {
  const locationInfo = apartmentInfo?.location
    ? ` <a href="${getLocation(apartmentInfo.location)}">location</a>`
    : '';
  const apartmentInfoUrl = apartmentInfo?.url
    ? ` <a href="${apartmentInfo.url}">url</a>`
    : '';

  return renderApartmentInfo(apartmentInfo) + locationInfo + apartmentInfoUrl;
}

function getApartmentListHtmlTemplate(apartmentList, filters) {
  const renderedApartmentList = apartmentList
    .sort(
      (firstApartment, secondApartment) =>
        firstApartment.price - secondApartment.price,
    )
    .reduce(
      (acc, currentApartmentInfo) =>
        `${acc}<li>${renderHtmlApartmentInfo(currentApartmentInfo)}`,
      '',
    );
  return `<div>${getMailHeader(
    filters,
    apartmentList.length,
  )}</div><ul>${renderedApartmentList}</li>`;
}

function renderTextApartmentInfo(apartmentInfo) {
  return renderApartmentInfo(apartmentInfo);
}

function getApartmentListTextTemplate(apartmentList, filters): string {
  const renderedApartmentList = apartmentList
    .sort(
      (firstApartment, secondApartment) =>
        firstApartment.price - secondApartment.price,
    )
    .reduce(
      (acc, currentApartmentInfo) =>
        `${acc}- ${renderTextApartmentInfo(currentApartmentInfo)}\n`,
      '',
    );
  return `${getMailHeader(
    filters,
    apartmentList.length,
  )}\n${renderedApartmentList}`;
}

function getMailSubject(filters: any, apartmentListLength: number): string {
  return `Found ${apartmentListLength} new apartment(s) for ${filters.RENT_OR_SALE}`;
}

export function getMailData(apartmentList: any, filters: any): any {
  return {
    from: 'zeljko@sevic.dev',
    html: getApartmentListHtmlTemplate(apartmentList, filters),
    subject: getMailSubject(filters, apartmentList.length),
    text: getApartmentListTextTemplate(apartmentList, filters),
    to: 'zeljkosevic95@gmail.com',
  };
}
