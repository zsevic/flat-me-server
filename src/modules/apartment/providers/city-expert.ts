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
import { apartmentStatusPublished } from '../apartment.constants';
import { Apartment } from '../apartment.interface';
import { AdvertiserType } from '../enums/advertiser-type.enum';

export class CityExpertProvider implements Provider {
  private readonly providerName = 'cityExpert';
  private readonly advertiserName = 'City Expert';
  private readonly propertyTypes = {
    BR: 'r',
    BS: 's',
  };

  private readonly atticKey = 'PTK';
  private readonly floor = {
    SU: 'basement',
    PR: 'ground floor',
    NPR: 'low ground floor',
    VPR: 'high ground floor',
    [this.atticKey]: 'attic',
  };

  private readonly apiBaseUrl = 'https://cityexpert.rs/api';
  private readonly logger = new Logger(CityExpertProvider.name);

  get apartmentBaseUrl() {
    return `${this.apiBaseUrl}/PropertyView`;
  }

  get searchUrl() {
    return `${this.apiBaseUrl}/Search/`;
  }

  createRequest(filter: FilterDto) {
    return createRequest.call(this, filter);
  }

  createRequestForApartment(apartmentId: string) {
    return createRequestForApartment.call(this, apartmentId);
  }

  createRequestConfig(filter: FilterDto): AxiosRequestConfig {
    const rentOrSale = {
      rent: 'r',
      sale: 's',
    };
    const furnished = {
      furnished: 1,
      'semi-furnished': 2,
      empty: 3,
    };
    const furnishedFilter = filter.furnished.map(
      (filter: string): number => furnished[filter],
    );
    const structureMap = {
      1: 1.0,
      2: 2.0,
      3: 3.0,
      4: 4.0,
    };
    const structureFilter = filter.structures.map(
      structure => structureMap[structure] || structure,
    );

    const requestBody = {
      ptId: [1],
      cityId: 1,
      rentOrSale: rentOrSale[filter.rentOrSale],
      currentPage: filter.pageNumber,
      resultsPerPage: 60,
      floor: [],
      avFrom: false,
      underConstruction: false,
      furnished: furnishedFilter,
      furnishingArray: [],
      heatingArray: [],
      parkingArray: [],
      petsArray: [],
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      minSize: null,
      maxSize: null,
      polygonsArray: filter.municipalities,
      searchSource: 'regular',
      sort: 'datedsc',
      structure: structureFilter,
      propIds: [],
      filed: [],
      ceiling: [],
      bldgOptsArray: [],
      joineryArray: [],
      yearOfConstruction: [],
      otherArray: [],
      numBeds: null,
      category: null,
      maxTenants: null,
      extraCost: null,
      numFloors: null,
      numBedrooms: null,
      numToilets: null,
      numBathrooms: null,
      heating: null,
      bldgEquipment: [],
      cleaning: null,
      extraSpace: [],
      parking: null,
      parkingIncluded: null,
      parkingExtraCost: null,
      parkingZone: null,
      petsAllowed: null,
      smokingAllowed: null,
      aptEquipment: [],
      site: 'SR',
    };

    return {
      url: this.searchUrl,
      headers: {
        'content-type': 'application/json',
      },
      data: requestBody,
      method: 'POST',
      timeout: DEFAULT_TIMEOUT,
    };
  }

  createRequestConfigForApartment(apartmentId: string): AxiosRequestConfig {
    return createRequestConfigForApartment.call(this, apartmentId);
  }

  getResults = data => data?.result;

  getApartmentUrl(apartmentId: string): string {
    const [propertyId, propertyType] = apartmentId.split('-');
    const type = this.propertyTypes[propertyType];
    if (!type) {
      throw new Error('Property type is not valid');
    }

    return `${this.apartmentBaseUrl}/${propertyId}/${type}`;
  }

  private getUrlFromApartmentInfo = apartmentInfo => {
    const rentOrSale = {
      r: 'izdavanje',
      s: 'prodaja',
    };
    const structures = {
      0.5: 'garsonjera',
      1: 'jednosoban',
      1.5: 'jednoiposoban',
      2: 'dvosoban',
      2.5: 'dvoiposoban',
      3: 'trosoban',
      3.5: 'troiposoban',
      4: 'četvorosoban',
    };

    return `https://cityexpert.rs/${
      rentOrSale[apartmentInfo.rentOrSale]
    }/stan/${apartmentInfo.propId}/${
      structures[apartmentInfo.structure]
    }-${this.getValueForUrl(apartmentInfo.street)}-${this.getValueForUrl(
      apartmentInfo.municipality,
    )}`;
  };

  private getValueForUrl = string =>
    string
      .split(' ')
      .join('-')
      .toLowerCase();

  hasNextPage = (data): boolean => data.info.hasNextPage;

  async isApartmentInactive(id: string): Promise<boolean> {
    try {
      const [, apartmentId] = id.split('_');

      const url = this.getApartmentUrl(apartmentId);
      const response = await axios.get(url, {
        timeout: DEFAULT_TIMEOUT,
      });
      if (response.data.status !== apartmentStatusPublished) {
        return true;
      }
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
    const [latitude, longitude] = apartmentInfo.location.split(', ');
    const furnished = {
      1: 'furnished',
      2: 'semi-furnished',
      3: 'empty',
    };
    const heatingTypesMap: Record<number, string> = {
      1: 'district',
      4: 'electricity',
      10: 'storage heater',
      21: 'underfloor',
      26: 'thermal pump',
      99: 'central',
    };
    const rentOrSaleField = {
      r: 'rent',
      s: 'sale',
    };

    const { structure } = apartmentInfo;
    const heatingTypes = [
      ...new Set<string>(
        apartmentInfo.heatingArray.map(
          (heatingType: number): string => heatingTypesMap[heatingType],
        ),
      ),
    ];

    return {
      id: `${this.providerName}_${apartmentInfo.uniqueID}`,
      apartmentId: apartmentInfo.uniqueID,
      providerName: this.providerName,
      ...(apartmentInfo.street && {
        address: capitalizeWords(apartmentInfo.street),
      }),
      advertiserType: AdvertiserType.Owner,
      availableFrom: apartmentInfo.availableFrom,
      coverPhotoUrl: `https://img.cityexpert.rs/sites/default/files/styles/1920x/public/image/${apartmentInfo.coverPhoto}`,
      advertiserName: this.advertiserName,
      floor: this.parseFloor(apartmentInfo.floor),
      furnished: furnished[apartmentInfo.furnished],
      heatingTypes,
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      municipality: apartmentInfo.municipality,
      place: apartmentInfo.municipality,
      postedAt: new Date(apartmentInfo.firstPublished),
      price: apartmentInfo.price,
      rentOrSale: rentOrSaleField[apartmentInfo.rentOrSale],
      size: apartmentInfo.size,
      structure: Number(structure),
      url: this.getUrlFromApartmentInfo(apartmentInfo),
    };
  };

  parseFloor(floorData, totalFloors?: number) {
    return parseFloor.call(this, floorData, this.atticKey, totalFloors);
  }

  updateApartmentInfo = (apartmentData, apartmentInfo: Apartment): void => {
    const floor = this.parseFloor(
      apartmentData.floor,
      apartmentData?.onsite?.basInfFloorTotal,
    );
    const place = apartmentData?.neighbourhoods?.[0];
    const advertiserType =
      apartmentData?.newDevelopment && AdvertiserType.Investor;

    Object.assign(apartmentInfo, {
      ...(advertiserType && { advertiserType }),
      ...(floor && { floor }),
      ...(place && { place }),
    });
  };
}
