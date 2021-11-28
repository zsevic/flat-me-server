import { HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import cheerio from 'cheerio';
import { DEFAULT_TIMEOUT, ECONNABORTED } from 'common/constants';
import { capitalizeWords } from 'common/utils';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Provider } from './provider.interface';
import {
  createRequest,
  createRequestConfigForApartment,
  createRequestForApartment,
  parseFloor,
} from './utils';
import { HALO_OGLASI_LOGO_URL } from '../apartment.constants';
import { Apartment } from '../apartment.interface';

export class HaloOglasiProvider implements Provider {
  private readonly providerName = 'haloOglasi';
  private readonly rentOrSaleMapForUrl = {
    rent: 'izdavanje',
    sale: 'prodaja',
  };

  readonly supportedSearch = {
    rent: true,
    sale: false,
  };

  private readonly atticKey = 'PTK';
  private readonly floor = {
    SU: 'basement',
    PR: 'ground floor',
    NPR: 'low ground floor',
    VPR: 'high ground floor',
    [this.atticKey]: 'attic',
  };

  private readonly domainUrl = 'https://www.halooglasi.com';
  private readonly logoUrl = HALO_OGLASI_LOGO_URL;
  private readonly logger = new Logger(HaloOglasiProvider.name);

  get baseUrl() {
    return this.domainUrl + '/nekretnine';
  }

  getSearchUrl(rentOrSale: string) {
    return `${this.baseUrl}/${rentOrSale}-stanova`;
  }

  createRequest(filter: FilterDto) {
    return createRequest.call(this, filter);
  }

  createRequestForApartment(apartmentId: string, url: string) {
    return createRequestForApartment.call(this, apartmentId, url);
  }

  createRequestConfig(filter: FilterDto): AxiosRequestConfig {
    const furnished = {
      furnished: 562,
      'semi-furnished': 563,
      empty: 564,
    };
    const municipalities = {
      Čukarica: 40381,
      'Novi Beograd': 40574,
      Palilula: 40761,
      Rakovica: 40769,
      'Savski venac': 40772,
      'Stari grad': 40776,
      Voždovac: 40783,
      Vračar: 40784,
      Zemun: 40787,
      Zvezdara: 40788,
    };
    const furnishedFilter =
      filter.furnished.length === 1
        ? furnished[filter.furnished[0]]
        : filter.furnished
            .map((filter: string): number => furnished[filter])
            .join(',');
    const municipalitiesFilter =
      filter.municipalities.length === 1
        ? municipalities[filter.municipalities[0]]
        : filter.municipalities
            .map((filter: string): number => municipalities[filter])
            .join(',');

    const params = {
      'grad_id_l-lokacija_id_l-mikrolokacija_id_l': municipalitiesFilter,
      cena_d_from: filter.minPrice,
      cena_d_to: filter.maxPrice,
      cena_d_unit: 4,
      namestenost_id_l: furnishedFilter,
    };

    return {
      url: this.getSearchUrl(this.rentOrSaleMapForUrl[filter.rentOrSale]),
      params,
      method: 'GET',
      timeout: DEFAULT_TIMEOUT,
    };
  }

  createRequestConfigForApartment(
    apartmentId: string,
    url: string,
  ): AxiosRequestConfig {
    return createRequestConfigForApartment.call(this, apartmentId, url);
  }

  getIdFromUrl = (url: string) => {
    const urlParts = url.split('/');
    const [id] = urlParts[urlParts.length - 1].split('?');

    return id;
  };

  getResults = (html: string, filter?: FilterDto) => {
    const $ = cheerio.load(html);
    const items = $('.product-item');
    const apartmentList = [];
    items.each((_, element) => {
      if (!element.children) return;

      try {
        const apartment = this.parseApartmentInfoFromHtml(element, filter);
        if (Object.keys(apartment).length > 0) {
          if (!apartment.advertiserLogoUrl) {
            apartment.advertiserLogoUrl =
              'https://www.flat-me.com/assets/logo.png';
          }
          apartment.place = apartment.place || apartment.municipality;
          apartment.rentOrSale = filter.rentOrSale;
          apartment.url = this.domainUrl + apartment.url;
          apartmentList.push(apartment);
        }
      } catch (error) {
        this.logger.error('Apartment parsing failed', error);
      }
    });

    return apartmentList;
  };

  hasNextPage = (): boolean => true;

  async isApartmentInactive(id: string, url?: string): Promise<boolean> {
    try {
      await axios.get(url, {
        timeout: DEFAULT_TIMEOUT,
      });
    } catch (error) {
      if (error.response?.status === HttpStatus.NOT_FOUND) return true;
      if (error.code === ECONNABORTED) {
        this.logger.error(
          `Connection aborted for apartment id ${id}, provider ${this.providerName}`,
        );
      } else {
        this.logger.error(error);
      }
    }
  }

  parseApartmentInfoFromHtml = (element: any, filter: FilterDto): Apartment => {
    const apartment: any = {};
    element.children.forEach((child: any) => {
      if (child?.attribs?.class === 'product-logo') {
        const link = child.children.find(c => c.name === 'a');
        if (link) {
          const image = link.children.find(c => c.name === 'img');
          if (image) {
            apartment.advertiserLogoUrl = image.attribs.src;
            return;
          }
        }
      }

      if (child?.attribs?.class === 'central-feature-wrapper') {
        if (child.children.length) {
          const elem = child.children.find(
            c => c.attribs.class === 'central-feature',
          );
          if (elem && elem.children.length > 0) {
            const priceValue = elem.children[0].attribs['data-value'];
            apartment.price = Number(priceValue.split('.').join(''));
            return;
          }
        }
      }

      const imageWrapper = child?.children?.find(
        c => c.attribs?.class === 'pi-img-wrapper',
      );
      if (imageWrapper) {
        const link = imageWrapper.children.find(c => c.name === 'a');
        if (link) {
          apartment.url = link.attribs.href;
          const img = link.children.find(c => c.name === 'img');
          if (img) {
            apartment.coverPhotoUrl = img.attribs.src;
          }
        }
      }

      const locationInfo = child?.children?.find(
        c => c.attribs?.class === 'subtitle-places',
      );
      if (locationInfo) {
        const addressIndex = locationInfo.children.length - 1;

        const municipalityInfo = locationInfo.children[1];
        const municipalityTextInfo = municipalityInfo.children[0].data;
        apartment.municipality = municipalityTextInfo.trim();

        if (addressIndex === 3) {
          const placeInfo = locationInfo.children[2];
          const placeTextInfo = placeInfo.children[0].data;
          apartment.place = placeTextInfo.trim();
        }

        const addressInfo = locationInfo.children[addressIndex];
        const addressTextInfo = addressInfo.children[0].data;
        apartment.address = addressTextInfo.trim();
      }

      const otherDetails = child?.children?.find(
        c => c.attribs?.class === 'product-features ',
      );
      if (otherDetails) {
        const sizeInfo = otherDetails.children[0];
        const sizeTextInfo = sizeInfo.children[0].children[0].data;
        const size = sizeTextInfo.trim().split(' ');
        const sizeValue = size[0].split(',').join('.');
        apartment.size = Number(sizeValue);

        const structureInfo = otherDetails.children[1];
        const structureTextInfo = structureInfo.children[0].children[0].data.trim();
        apartment.structure = structureTextInfo;
      }
    });

    return apartment;
  };

  parseApartmentInfo = (apartmentInfo): Apartment => {
    const municipalitiesMap = {
      'Opština Čukarica': 'Čukarica',
      'Opština Novi Beograd': 'Novi Beograd',
      'Opština Palilula': 'Palilula',
      'Opština Rakovica': 'Rakovica',
      'Opština Savski venac': 'Savski venac',
      'Opština Stari grad': 'Stari grad',
      'Opština Voždovac': 'Voždovac',
      'Opština Vračar': 'Vračar',
      'Opština Zemun': 'Zemun',
      'Opština Zvezdara': 'Zvezdara',
    };
    const apartmentId = this.getIdFromUrl(apartmentInfo.url);

    Object.assign(apartmentInfo, {
      municipality: municipalitiesMap[apartmentInfo.municipality],
      id: `${this.providerName}_${apartmentId}`,
      apartmentId,
      providerName: this.providerName,
      heatingTypes: [],
      furnished: 'furnished',
      floor: 1,
    });

    return apartmentInfo;
  };

  parseFloor(floorData, totalFloors?: number) {
    return parseFloor.call(this, floorData, this.atticKey, totalFloors);
  }

  updateInfoFromApartment = (apartmentData, apartmentInfo: Apartment): void => {
    return;
  };
}
