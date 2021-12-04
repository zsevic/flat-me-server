import { HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import cheerio from 'cheerio';
import jsdom from 'jsdom';
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
import { Apartment } from '../apartment.interface';

export class HaloOglasiProvider implements Provider {
  private readonly providerName = 'haloOglasi';
  private readonly rentOrSaleMapForUrl = {
    rent: 'izdavanje',
    sale: 'prodaja',
  };

  private readonly atticKey = 'PTK';
  private readonly floor = {
    SUT: 'basement',
    PSUT: 'semi-basement',
    PR: 'ground floor',
    VPR: 'high ground floor',
    [this.atticKey]: 'attic',
  };

  private readonly domainUrl = 'https://www.halooglasi.com';
  private readonly imageBaseUrl = 'https://img.halooglasi.com';
  private readonly logger = new Logger(HaloOglasiProvider.name);

  get baseUrl() {
    return this.domainUrl + '/nekretnine';
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
      ...(filter.rentOrSale === 'rent' && {
        namestenost_id_l: furnishedFilter,
      }),
      page: filter.pageNumber,
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
    if (!url) {
      throw new Error(
        `Can't create request configuration for apartment ${apartmentId}, url is missing`,
      );
    }

    return createRequestConfigForApartment.call(this, apartmentId, url);
  }

  private getApartmentIdFromUrl = (url: string) => {
    const urlParts = url.split('/');
    const [id] = urlParts[urlParts.length - 1].split('?');

    return id;
  };

  getResults = (html: string, filter?: FilterDto) => {
    const $ = cheerio.load(html);
    const links = $('.product-title > a');
    const apartmentList = [];
    links.each((_, element) => {
      try {
        const link = element.attribs.href;
        if (link) {
          const apartment = {
            rentOrSale: filter.rentOrSale,
            url: this.domainUrl + link,
          };
          apartmentList.push(apartment);
        }
      } catch (error) {
        this.logger.error('Apartment parsing failed', error);
      }
    });

    return apartmentList;
  };

  private getSearchUrl(rentOrSale: string) {
    return `${this.baseUrl}/${rentOrSale}-stanova`;
  }

  hasNextPage = (): boolean => true;

  async isApartmentInactive(id: string, url?: string): Promise<boolean> {
    try {
      if (!url) {
        throw new Error(`Url for apartment ${id} is missing`);
      }
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

  parseApartmentInfo = (apartmentInfo): Apartment => {
    const apartmentId = this.getApartmentIdFromUrl(apartmentInfo.url);

    Object.assign(apartmentInfo, {
      id: `${this.providerName}_${apartmentId}`,
      apartmentId,
      providerName: this.providerName,
    });

    return apartmentInfo;
  };

  parseFloor(floorData, totalFloors?: number) {
    return parseFloor.call(this, floorData, this.atticKey, totalFloors);
  }

  updateApartmentInfo = (
    apartmentDataHtml: string,
    apartmentInfo: Apartment,
  ): void => {
    try {
      const virtualConsole = new jsdom.VirtualConsole();
      const dom = new jsdom.JSDOM(apartmentDataHtml, {
        runScripts: 'dangerously',
        virtualConsole,
      });

      const apartmentData = dom?.window?.QuidditaEnvironment?.CurrentClassified;
      const advertiserData =
        dom?.window?.QuidditaEnvironment?.CurrentContactData?.Advertiser;

      const floor = this.parseFloor(
        apartmentData?.sprat_s,
        apartmentData?.sprat_od_s,
      );

      const furnishedMap = {
        562: 'furnished',
        563: 'semi-furnished',
        564: 'empty',
      };

      const heatingTypesMap: Record<number, string> = {
        1542: 'district',
        1543: 'electricity',
        1544: 'storage heater',
        1545: 'gas',
        1546: 'underfloor',
        1547: 'tile stove',
        1548: 'norwegian radiators',
        1549: 'marble radiators',
        1550: 'thermal pump',
      };

      const municipalitiesMap = {
        40381: 'Čukarica',
        40574: 'Novi Beograd',
        40761: 'Palilula',
        40769: 'Rakovica',
        40772: 'Savski venac',
        40776: 'Stari grad',
        40783: 'Voždovac',
        40784: 'Vračar',
        40787: 'Zemun',
        40788: 'Zvezdara',
      };

      const advertiserName =
        apartmentData.oglasivac_nekretnine_s !== 'Vlasnik' &&
        advertiserData?.DisplayName;
      const address = apartmentData.ulica_t;
      const photosUrls = apartmentData?.ImageURLs;
      const furnished = furnishedMap[apartmentData.namestenost_id_l];

      const heatingType = heatingTypesMap[apartmentData.grejanje_id_l];
      const heatingTypes = heatingType ? [heatingType] : [];

      let location;
      const locationArray = apartmentData.GeoLocationRPT?.split(',');
      if (locationArray?.length === 2) {
        const [latitude, longitude] = locationArray;
        location = {
          latitude: Number(latitude),
          longitude: Number(longitude),
        };
      }
      const municipalityId = apartmentData.lokacija_id_l;
      const municipality = municipalitiesMap[municipalityId];

      const place = apartmentData.mikrolokacija_s;
      const price = apartmentData.cena_d;
      const size = apartmentData.kvadratura_d;
      const structure = apartmentData.broj_soba_s;

      Object.assign(apartmentInfo, {
        ...(address && { address: capitalizeWords(address) }),
        ...(advertiserName && { advertiserName }),
        ...(photosUrls?.length > 0 && {
          coverPhotoUrl: this.imageBaseUrl + photosUrls[0],
        }),
        ...(floor && { floor }),
        ...(furnished && { furnished }),
        heatingTypes,
        ...(location && { location }),
        ...(municipality && { municipality }),
        ...(place && { place }),
        ...(price && { price }),
        ...(size && { size }),
        ...(structure && { structure }),
      });
    } catch (error) {
      this.logger.error(error);
    }
  };
}
