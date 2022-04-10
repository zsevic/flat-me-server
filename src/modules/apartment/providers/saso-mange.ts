import { HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import jsdom from 'jsdom';
import latinize from 'latinize';
import { DEFAULT_TIMEOUT, ECONNABORTED, ECONNRESET } from 'common/constants';
import { capitalizeWords } from 'common/utils';
import { MUNICIPALITIES } from 'modules/filter/filter.constants';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { RentOrSale } from 'modules/filter/filter.enums';
import { Provider } from './provider.interface';
import { ApartmentStatus, CategoryCode } from './saso-mange.enums';
import {
  createRequest,
  createRequestConfigForApartment,
  createRequestForApartment,
} from './utils';
import { Apartment } from '../apartment.interface';
import { AdvertiserType } from '../enums/advertiser-type.enum';
import { Floor } from '../enums/floor.enum';
import { Furnished } from '../enums/furnished.enum';
import { HeatingType } from '../enums/heating-type.enum';

export class SasoMangeProvider implements Provider {
  private readonly providerName = 'sasoMange';

  private readonly atticKey = 'floor_attic';
  private readonly productsSort = 'newnessDesc';
  private readonly floorMap = {
    floor_basement: Floor.Basement,
    floor_low_ground_floor: Floor.LowGroundFloor,
    floor_ground_floor: Floor.GroundFloor,
    floor_high_floor: Floor.HighGroundFloor,
    floor_after_15: '15+',
    [this.atticKey]: Floor.Attic,
  };

  private readonly domainUrl = 'https://sasomange.rs';
  private readonly logger = new Logger(SasoMangeProvider.name);

  get apiUrl() {
    return `${this.domainUrl}/hybris/classified/v1/products/extended`;
  }

  private createFilterParams(filter: FilterDto): string {
    const municipalityMap = {
      Čukarica: 'beograd-cukarica',
      'Novi Beograd': 'beograd-novi-beograd',
      Palilula: 'beograd-palilula',
      Rakovica: 'beograd-rakovica',
      'Savski venac': 'beograd-savski-venac',
      'Stari grad': 'beograd-stari-grad',
      Voždovac: 'beograd-vozdovac',
      Vračar: 'beograd-vracar',
      Zemun: 'beograd-zemun',
      Zvezdara: 'beograd-zvezdara',
    };

    const { rentOrSale } = filter;
    const locationParams = [];
    filter.municipalities.forEach(municipality => {
      const mappedMunicipality = municipalityMap[municipality];
      if (!mappedMunicipality) return;

      locationParams.push(`location:${mappedMunicipality}`);
    });

    const priceParam = `priceValue:(${filter.minPrice}-${filter.maxPrice})`;
    const structureParams = `flats_structure_${filter.rentOrSale}:(0.5-4)`;

    const filterParams = [
      priceParam,
      ...locationParams,
      structureParams,
    ];

    return filterParams.join(',');
  }

  createRequest(filter: FilterDto) {
    return createRequest.call(this, filter);
  }

  createRequestForApartment(apartmentId: string, url: string) {
    return createRequestForApartment.call(this, apartmentId, url);
  }

  createRequestConfig(filter: FilterDto): AxiosRequestConfig {
    const rentOrSaleMap = {
      rent: CategoryCode.Rent,
      sale: CategoryCode.Sale,
    };

    const productsFacetsFlattened = this.createFilterParams(filter);

    const params = {
      productsSort: this.productsSort,
      currentPage: filter.pageNumber - 1,
      category: rentOrSaleMap[filter.rentOrSale],
      productsFacetsFlattened,
    };

    return {
      url: this.apiUrl,
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

  private getApartmentDataFromDom(dom) {
    const data = dom?.window?.document?.getElementById(
      'HybrisClassifiedProductExtended',
    )?.value;
    if (!data) return;

    return JSON.parse(data);
  }

  private getClassificationCode(rentOrSale: string): string {
    return `general_flats_${rentOrSale}`;
  }

  private getFullClassificationCode(rentOrSale: string): string {
    const classificationCode = this.getClassificationCode(rentOrSale);
    return `smrsClassificationCatalog/1.0/${classificationCode}`;
  }

  private getFeatureValue(
    code: string,
    apartmentData,
  ): string {
    return apartmentData?.product?.highlightedAttributes?.find(
      attribute => attribute.code === code,
    )?.featureValues?.[0]?.value;
  }

  getResults = data => {
    const rentOrSaleMap = {
      [CategoryCode.Rent]: RentOrSale.rent,
      [CategoryCode.Sale]: RentOrSale.sale,
    };

    return (
      data?.products?.products?.map(product => ({
        ...product,
        rentOrSale: rentOrSaleMap[data?.products?.categoryCode],
      })) || []
    );
  };

  hasNextPage = (data): boolean => {
    return (
      data.products.pagination.currentPage + 1 <
      data.products.pagination.totalPages
    );
  };

  async isApartmentInactive(id: string, url?: string): Promise<boolean> {
    try {
      if (!url) {
        throw new Error(`Url for apartment ${id} is missing`);
      }
      const [requestUrl] = url.split('?');
      const apartmentDataHtml = await axios.get(requestUrl, {
        timeout: DEFAULT_TIMEOUT,
      });
      const responseUrl = apartmentDataHtml.request?.res?.responseUrl;
      if (requestUrl !== responseUrl) return true;

      const virtualConsole = new jsdom.VirtualConsole();
      const dom = new jsdom.JSDOM(apartmentDataHtml.data, {
        runScripts: 'dangerously',
        virtualConsole,
      });

      const apartmentData = this.getApartmentDataFromDom(dom);
      if (!apartmentData) return;

      if (apartmentData.product.status === ApartmentStatus.Active) {
        return;
      }
    } catch (error) {
      if (error.response?.status === HttpStatus.NOT_FOUND) return true;
      if ([ECONNABORTED, ECONNRESET].includes(error.code)) {
        this.logger.error(
          `Connection aborted for apartment id ${id}, provider ${this.providerName}`,
        );
      } else {
        this.logger.error(error);
      }
    }
  }

  parseApartmentInfo = (apartmentInfo): Apartment => {
    const apartmentId = apartmentInfo.smSku;
    const apartmentInfoLocation = apartmentInfo.addresses?.[0]?.location;
    const microlocation = apartmentInfoLocation?.find(
      address => address.type === 'MICROLOCATION',
    );
    let location;
    if (microlocation) {
      location = {
        latitude: Number(microlocation.latitude),
        longitude: Number(microlocation.longitude),
      };
    }

    const municipality = apartmentInfoLocation?.find(
      address => address.type === 'SUBLOCATION',
    );
    if (!MUNICIPALITIES.includes(municipality.name)) {
      this.logger.warn(`Municipality ${municipality.name} is not valid`);
      return;
    }

    const { highlightedAttributes: attributes } = apartmentInfo;
    const fullClassificationCode = this.getFullClassificationCode(
      apartmentInfo.rentOrSale,
    );
    const size = attributes?.find(
      attribute => attribute.code === `${fullClassificationCode}.estate_area`,
    )?.featureValues[0].value;

    return {
      id: `${this.providerName}_${apartmentId}`,
      apartmentId,
      providerName: this.providerName,
      address:
        microlocation?.name && capitalizeWords(latinize(microlocation.name)),
      coverPhotoUrl: apartmentInfo.images?.find(
        image => image.format === 'smThumbnailFormat',
      )?.url,
      floor: null,
      heatingTypes: null,
      location,
      municipality: municipality.name,
      place: capitalizeWords(microlocation?.name),
      postedAt: new Date(apartmentInfo.originalPublishedDate),
      price: apartmentInfo.price?.value,
      rentOrSale: apartmentInfo.rentOrSale,
      size: size && Number(size),
      structure: null,
      url: this.domainUrl + '/p' + apartmentInfo.url,
    };
  };

  parseFloor(floorValue: string, totalFloors?: number): string {
    if (this.floorMap[floorValue]) {
      return this.floorMap[floorValue];
    }
    const [, floor] = floorValue.split('_');

    if (Number(floor) === Number(totalFloors) && !isNaN(totalFloors)) {
      return this.floorMap[this.atticKey];
    }

    return floor;
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
      const apartmentData = this.getApartmentDataFromDom(dom);

      const address = apartmentData?.product?.addresses?.[0]?.streetName;
      const advertiserTypeMap = {
        advertiser_agency: AdvertiserType.Agency,
        advertiser_investor: AdvertiserType.Investor,
        advertiser_owner: AdvertiserType.Owner,
      };
      const furnishedMap = {
        furnished_full: Furnished.Full,
        furnished_semi: Furnished.Semi,
        furnished_empty: Furnished.Empty,
      };
      const heatingTypesMap = {
        land_heating_central: HeatingType.District,
        land_heating_electricity: HeatingType.Electricity,
        land_heating_floors: HeatingType.Central,
        land_heating_ta: HeatingType.StorageHeater,
        land_heating_gas: HeatingType.Gas,
        land_heating_norwegian_radiators: HeatingType.NorwegianRadiators,
        land_heating_floor: HeatingType.Underfloor,
        land_heating_marble_radiators: HeatingType.MarbleRadiators,
      };
      const structureMap = {
        large_studio_estate_structure: 0.5,
        one_room_estate_structure: 1,
        one_and_half_room_estate_structure: 1.5,
        two_rooms_estate_structure: 2,
        two_and_half_room_estate_structure: 2.5,
        three_rooms_estate_structure: 3,
        three_and_half_room_estate_structure: 3.5,
        four_rooms_estate_structure: 4,
      };

      const { rentOrSale } = apartmentInfo;

      const fullClassificationCode = this.getFullClassificationCode(
        apartmentInfo.rentOrSale,
      );
      const advertiser = this.getFeatureValue(
        `${fullClassificationCode}.advertiser`,
        apartmentData,
      );
      const advertiserType = advertiserTypeMap[advertiser];
      const advertiserName =
        apartmentData?.vendorBasicInfoStatus?.legalEntityName;

      const floorValue = this.getFeatureValue(
        `${fullClassificationCode}.floor`,
        apartmentData,
      );
      const totalFloorsValue = this.getFeatureValue(
        `${fullClassificationCode}.number_storeys`,
        apartmentData,
      );
      const floor =
        floorValue && this.parseFloor(floorValue, Number(totalFloorsValue));

      const furnishedValue = this.getFeatureValue(
        `${fullClassificationCode}.furnished`,
        apartmentData,
      );
      const furnished = furnishedMap[furnishedValue];

      const heatingTypeValue = this.getFeatureValue(
        `${fullClassificationCode}.land_heating`,
        apartmentData,
      );
      const heatingType = heatingTypesMap[heatingTypeValue];
      const heatingTypes = heatingType ? [heatingType] : [];

      const latitude = apartmentData?.product?.addresses?.[0]?.latitude;
      const longitude = apartmentData?.product?.addresses?.[0]?.longitude;
      let location;
      if (latitude && longitude) {
        location = {
          latitude: Number(latitude),
          longitude: Number(longitude),
        };
      }

      const structureValue = this.getFeatureValue(
        `${fullClassificationCode}.estate_structure`,
        apartmentData,
      );
      const structure = structureMap[structureValue];

      Object.assign(apartmentInfo, {
        ...(address && {
          address: capitalizeWords(latinize(address)),
        }),
        ...(advertiserName && {
          advertiserName: capitalizeWords(
            latinize(advertiserName.replace(new RegExp('\t', 'g'), '')),
          ),
        }),
        ...(advertiserType && {
          advertiserType,
        }),
        ...(floor && { floor }),
        ...(furnished && { furnished }),
        heatingTypes,
        ...(location && { location }),
        ...(structure && { structure }),
      });
    } catch (error) {
      this.logger.error(error);
    }
  };
}
