import { HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import latinize from 'latinize';
import { DEFAULT_TIMEOUT, ECONNABORTED } from 'common/constants';
import { capitalizeWords } from 'common/utils';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { RentOrSale } from 'modules/filter/filter.enums';
import { Provider } from './provider.interface';
import {
  createRequest,
  createRequestConfigForApartment,
  createRequestForApartment,
  parseFloor,
} from './utils';
import {
  apartmentStateInProgress,
  apartmentStatusHidden,
  CETIRI_ZIDA_LOGO_URL,
} from '../apartment.constants';
import { Apartment } from '../apartment.interface';
import { AdvertiserType } from '../enums/advertiser-type.enum';
import { Floor } from '../enums/floor.enum';
import { Furnished } from '../enums/furnished.enum';
import { HeatingType } from '../enums/heating-type.enum';
import { ApartmentRepository } from '../apartment.repository';

export class CetiriZidaProvider implements Provider {
  private readonly providerName = 'cetiriZida';
  private readonly apiBaseUrl = 'https://api.4zida.rs';
  private readonly logoUrl = CETIRI_ZIDA_LOGO_URL;
  private readonly logger = new Logger(CetiriZidaProvider.name);

  private readonly atticKey = 100;
  private readonly floor = {
    '-4': Floor.Cellar,
    '-3': Floor.Basement,
    '-2': Floor.LowGroundFloor,
    '-1': Floor.GroundFloor,
    '0': Floor.HighGroundFloor,
    [this.atticKey]: Floor.Attic,
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
      [Furnished.Empty]: 'no',
      [Furnished.Full]: 'yes',
      [Furnished.Semi]: 'semi',
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
      '3.5': 107,
      4: 108,
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

  private getAdvertiserType = (apartmentData): AdvertiserType => {
    if (
      apartmentData?.state === apartmentStateInProgress &&
      apartmentData?.for === RentOrSale.sale
    )
      return AdvertiserType.Investor;

    return apartmentData?.author?.agency
      ? AdvertiserType.Agency
      : AdvertiserType.Owner;
  };

  getApartmentUrl(apartmentId: string): string {
    return `${this.apartmentBaseUrl}/${apartmentId}`;
  }

  getResults = data => data?.ads;

  hasNextPage = (data, pageNumber: number): boolean => {
    const currentCount = data.ads.length * pageNumber;
    return currentCount > 0 && data.total > currentCount;
  };

  async updateCurrentPriceAndReturnIsApartmentInactive(
    id: string,
    repository: ApartmentRepository,
  ): Promise<boolean> {
    const [, apartmentId] = id.split('_');
    try {
      const url = this.getApartmentUrl(apartmentId);
      const response = await axios.get(url, {
        timeout: DEFAULT_TIMEOUT,
      });
      const status = response?.data?.status;
      await repository.updateCurrentPrice(id, response?.data.price);
      if (status === apartmentStatusHidden) return true;
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
      no: Furnished.Empty,
      semi: Furnished.Semi,
      yes: Furnished.Full,
    };

    const heatingTypesMap = {
      central: HeatingType.Central,
      district: HeatingType.District,
      electricity: HeatingType.Electricity,
      gas: HeatingType.Gas,
      norwegianRadiators: HeatingType.NorwegianRadiators,
      storageHeater: HeatingType.StorageHeater,
      thermalPump: HeatingType.ThermalPump,
      tileStove: HeatingType.TileStove,
      underfloor: HeatingType.Underfloor,
    };
    const heatingType = heatingTypesMap[apartmentInfo.heatingType];
    const heatingTypes = heatingType ? [heatingType] : [];

    return {
      id: `${this.providerName}_${apartmentInfo.id}`,
      apartmentId: apartmentInfo.id,
      providerName: this.providerName,
      ...(apartmentInfo.address && {
        address: capitalizeWords(latinize(apartmentInfo.address)),
      }),
      coverPhotoUrl: apartmentInfo?.image?.search['380x0_fill_0_webp'],
      floor: this.parseFloor(
        apartmentInfo.redactedFloor,
        apartmentInfo?.redactedTotalFloors,
      ),
      furnished: furnished[apartmentInfo.furnished],
      heatingTypes,
      municipality: this.getMunicipality(apartmentInfo),
      place: capitalizeWords(apartmentInfo?.placeNames?.[0]),
      postedAt: new Date(apartmentInfo.createdAt),
      price: apartmentInfo.price,
      rentOrSale: apartmentInfo.for,
      size: apartmentInfo.m2,
      structure: Number(apartmentInfo.roomCount),
      url: `https://4zida.rs${apartmentInfo.urlPath}`,
    };
  };

  parseFloor(floorData, totalFloors?: number) {
    return parseFloor.call(this, floorData, this.atticKey, totalFloors);
  }

  updateApartmentInfo = (apartmentData, apartmentInfo: Apartment): void => {
    const postedAt =
      apartmentData?.boostedOrFeaturedOn ||
      apartmentData?.lastBoostedAt ||
      apartmentData?.renewedAt;
    let location;
    const { latitude, longitude } = apartmentData;
    if (latitude && longitude) {
      location = {
        latitude: Number(latitude),
        longitude: Number(longitude),
      };
    }
    const advertiserName = apartmentData?.author?.agency?.title;
    const advertiserType = this.getAdvertiserType(apartmentData);

    Object.assign(apartmentInfo, {
      ...(advertiserName && { advertiserName }),
      ...(advertiserType && { advertiserType }),
      ...(location?.latitude && location?.longitude && { location }),
      ...(postedAt && { postedAt: new Date(postedAt) }),
    });
  };
}
