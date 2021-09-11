import { HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { DEFAULT_TIMEOUT, ECONNABORTED } from 'common/constants';
import { capitalizeWords } from 'common/utils';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Provider } from './provider.interface';
import { createRequest } from './utils';
import {
  apartmentActivityBaseUrlForCityExpert,
  apartmentStatusFinished,
  apartmentStatusNotAvailable,
  CITY_EXPERT_API_BASE_URL,
} from '../apartment.constants';
import { Apartment } from '../apartment.interface';

export class CityExpertProvider implements Provider {
  private readonly providerName = 'cityExpert';
  private readonly propertyTypes = {
    BR: 'r',
    BS: 's',
  };

  private readonly url = `${CITY_EXPERT_API_BASE_URL}/Search/`;
  private readonly logger = new Logger(CityExpertProvider.name);

  createRequest(filter: FilterDto) {
    return createRequest.call(this, filter);
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
      structure: filter.structures,
      propIds: [],
      filed: filter.rentOrSale === 'sale' ? [2] : [],
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
      url: this.url,
      headers: {
        'content-type': 'application/json',
      },
      data: requestBody,
      method: 'POST',
    };
  }

  getResults = data => data?.result;

  private getValueForUrl = string =>
    string
      .split(' ')
      .join('-')
      .toLowerCase();

  private getUrlFromApartmentInfo = apartmentInfo => {
    const rentOrSale = {
      r: 'izdavanje',
      s: 'prodaja',
    };
    const structures = {
      '0.5': 'garsonjera',
      '1.0': 'jednosoban',
      1.5: 'jednoiposoban',
      '2.0': 'dvosoban',
      2.5: 'dvoiposoban',
      '3.0': 'trosoban',
    };

    return `https://cityexpert.rs/${
      rentOrSale[apartmentInfo.rentOrSale]
    }/stan/${apartmentInfo.propId}/${
      structures[apartmentInfo.structure]
    }-${this.getValueForUrl(apartmentInfo.street)}-${this.getValueForUrl(
      apartmentInfo.municipality,
    )}`;
  };

  hasNextPage = (data): boolean => data.info.hasNextPage;

  async isApartmentInactive(id: string): Promise<boolean> {
    try {
      const [, apartmentId] = id.split('_');
      const [propertyId, propertyType] = apartmentId.split('-');
      if (!this.propertyTypes[propertyType]) {
        return Promise.reject(new Error('Property type is not valid'));
      }

      const response = await axios.get(
        `${apartmentActivityBaseUrlForCityExpert}/${propertyId}/${this.propertyTypes[propertyType]}`,
        {
          timeout: DEFAULT_TIMEOUT,
        },
      );
      if (
        [apartmentStatusFinished, apartmentStatusNotAvailable].includes(
          response.data.status,
        )
      ) {
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
    const floor = {
      SU: 'basement',
      PR: 'ground floor',
      NPR: 'low ground floor',
      VPR: 'high ground floor',
      '2_4': '2-4',
      '5_10': '5-10',
      '11+': '11+',
      PTK: 'attic',
    };
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
      availableFrom: apartmentInfo.availableFrom,
      coverPhotoUrl: `https://img.cityexpert.rs/sites/default/files/styles/1920x/public/image/${apartmentInfo.coverPhoto}`,
      floor: floor[apartmentInfo.floor] || apartmentInfo.floor,
      furnished: furnished[apartmentInfo.furnished],
      heatingTypes,
      location: {
        latitude,
        longitude,
      },
      municipality: apartmentInfo.municipality,
      place: apartmentInfo?.polygons?.[0],
      price: apartmentInfo.price,
      rentOrSale: rentOrSaleField[apartmentInfo.rentOrSale],
      size: apartmentInfo.size,
      structure: Number(structure),
      url: this.getUrlFromApartmentInfo(apartmentInfo),
    };
  };
}
