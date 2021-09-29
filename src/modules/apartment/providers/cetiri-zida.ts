import { HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
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

export class CetiriZidaProvider implements Provider {
  private readonly providerName = 'cetiriZida';
  private readonly apiBaseUrl = 'https://api.4zida.rs';
  private readonly logoUrl =
    'https://www.4zida.rs/assets/images/logos/deo-is-grupe-white.png';
  private readonly logger = new Logger(CetiriZidaProvider.name);

  private readonly atticKey = 100;
  private readonly floor = {
    '-4': 'cellar',
    '-3': 'basement',
    '-2': 'low ground floor',
    '-1': 'ground floor',
    '0': 'high ground floor',
    [this.atticKey]: 'attic',
  };

  get apartmentBaseUrl() {
    return `${this.apiBaseUrl}/v5/eds`;
  }

  get searchUrl() {
    return `${this.apiBaseUrl}/v6/search/apartments`;
  }

  createRequest(filter: FilterDto) {
    return createRequest.call(this, filter);
  }

  createRequestForApartment(apartmentId: string) {
    return createRequestForApartment.call(this, apartmentId);
  }

  createRequestConfig(filter: FilterDto): AxiosRequestConfig {
    const furnished = {
      empty: 'no',
      furnished: 'yes',
      'semi-furnished': 'semi',
    };
    const furnishedFilter = filter.furnished.map(
      (filter: string): string => furnished[filter],
    );
    const structures = {
      '0.5': 101,
      1: 102,
      '1.5': 103,
      2: 104,
      '2.5': 105,
      3: 106,
    };
    const placesIds = {
      Čukarica: 28267,
      'Novi Beograd': 139,
      Palilula: 28257,
      Rakovica: 28258,
      'Savski venac': 213,
      'Stari grad': 28261,
      Voždovac: 28263,
      Vračar: 541,
      Zemun: 28265,
      Zvezdara: 28266,
    };
    const rentOrSale = {
      rent: 'rent',
      sale: 'sale',
    };

    const params = {
      for: rentOrSale[filter.rentOrSale],
      furnishedTypes: furnishedFilter,
      priceFrom: filter.minPrice,
      priceTo: filter.maxPrice,
      page: filter.pageNumber,
      placeIds: Object.keys(placesIds)
        .filter(place => filter.municipalities.includes(place))
        .map(place => placesIds[place]),
      ...(filter.rentOrSale === rentOrSale.sale && { registered: 1 }),
      structures: Object.keys(structures)
        .map(structure => Number(structure))
        .filter(structure => filter.structures.indexOf(structure) !== -1)
        .map(structure => structures[structure]),
    };

    return {
      url: this.searchUrl,
      params,
      timeout: DEFAULT_TIMEOUT,
    };
  }

  createRequestConfigForApartment(apartmentId: string): AxiosRequestConfig {
    return createRequestConfigForApartment.call(this, apartmentId);
  }

  getApartmentUrl(apartmentId: string): string {
    return `${this.apartmentBaseUrl}/${apartmentId}`;
  }

  getResults = data => data?.ads;

  hasNextPage = (data, pageNumber: number): boolean => {
    const currentCount = data.ads.length * pageNumber;
    return currentCount > 0 && data.total > currentCount;
  };

  async isApartmentInactive(id: string): Promise<boolean> {
    const [, apartmentId] = id.split('_');
    try {
      const url = this.getApartmentUrl(apartmentId);
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

  private getAdvertiserLogoUrl = advertiserLogoUrl => {
    if (!advertiserLogoUrl) return this.logoUrl;

    return advertiserLogoUrl
      .replace('{{mode}}', 'fit')
      .replace('{{width}}', '75')
      .replace('{{height}}', '75')
      .replace('{{format}}', 'webp');
  };

  private getMunicipality = apartmentInfo => {
    const municipalities = {
      Čukarica: 'Čukarica',
      'Novi Beograd': 'Novi Beograd',
      'Palilula opština': 'Palilula',
      'Rakovica opština': 'Rakovica',
      'Savski Venac': 'Savski venac',
      'Stari Grad opština': 'Stari grad',
      'Voždovac opština': 'Voždovac',
      Vračar: 'Vračar',
      Zemun: 'Zemun',
      'Zvezdara opština': 'Zvezdara',
    };

    const municipalityKey = apartmentInfo?.placeNames.find(placeName =>
      Object.hasOwnProperty.call(municipalities, placeName),
    );
    return municipalities[municipalityKey];
  };

  parseApartmentInfo = (apartmentInfo): Apartment => {
    const furnished = {
      no: 'empty',
      semi: 'semi-furnished',
      yes: 'furnished',
    };

    const heatingTypesMap = {
      central: 'central',
      district: 'district',
      electricity: 'electricity',
      gas: 'gas',
      norwegianRadiators: 'norwegian radiators',
      storageHeater: 'storage heater',
      thermalPump: 'thermal pump',
      tileStove: 'tile stove',
      underfloor: 'underfloor',
    };
    const heatingType = heatingTypesMap[apartmentInfo.heatingType];
    const heatingTypes = heatingType ? [heatingType] : [];

    return {
      id: `${this.providerName}_${apartmentInfo.id}`,
      apartmentId: apartmentInfo.id,
      providerName: this.providerName,
      ...(apartmentInfo.address && {
        address: capitalizeWords(apartmentInfo.address),
      }),
      coverPhotoUrl: apartmentInfo?.image?.search['380x0_fill_0_webp'],
      advertiserLogoUrl: this.getAdvertiserLogoUrl(
        apartmentInfo.agencyAvatarUrlTemplate,
      ),
      floor: this.parseFloor(apartmentInfo.floor),
      furnished: furnished[apartmentInfo.furnished],
      heatingTypes,
      municipality: this.getMunicipality(apartmentInfo),
      place: apartmentInfo?.placeNames?.[0],
      postedAt: new Date(apartmentInfo.createdAt),
      price: apartmentInfo.price,
      rentOrSale: apartmentInfo.for,
      size: apartmentInfo.m2,
      structure: apartmentInfo.roomCount,
      url: `https://4zida.rs${apartmentInfo.urlPath}`,
    };
  };

  parseFloor(floorData, totalFloors?: number) {
    return parseFloor.call(this, floorData, this.atticKey, totalFloors);
  }

  updateInfoFromApartment = (apartmentData, apartmentInfo: Apartment): void => {
    const floor = this.parseFloor(
      apartmentData.floor,
      apartmentData?.totalFloors,
    );
    if (!floor) {
      this.logger.log(
        `Skip updating the floor for apartment ${apartmentInfo.id}`,
      );
      return;
    }

    Object.assign(apartmentInfo, { floor });
  };
}
