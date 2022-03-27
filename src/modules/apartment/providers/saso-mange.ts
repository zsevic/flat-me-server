import { HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import jsdom from 'jsdom';
import { DEFAULT_TIMEOUT, ECONNABORTED, ECONNRESET } from 'common/constants';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Provider } from './provider.interface';
import {
  createRequest,
  createRequestConfigForApartment,
  createRequestForApartment,
  parseFloor,
} from './utils';
import {
  apartmentStatusExpired,
  apartmentStatusPaused,
} from '../apartment.constants';
import { Apartment } from '../apartment.interface';
import { AdvertiserType } from '../enums/advertiser-type.enum';
import { Furnished } from '../enums/furnished.enum';

export class SasoMangeProvider implements Provider {
  private readonly providerName = 'sasoMange';

  private readonly atticKey = 'PTK';
  private readonly floor = {
    SUT: 'basement',
    PSUT: 'semi-basement',
    PR: 'ground floor',
    VPR: 'high ground floor',
    [this.atticKey]: 'attic',
  };

  private readonly domainUrl = 'https://sasomange.rs';
  private readonly logger = new Logger(SasoMangeProvider.name);

  get apiUrl() {
    return `${this.domainUrl}/hybris/classified/v1/products/extended`;
  }

  createRequest(filter: FilterDto) {
    return createRequest.call(this, filter);
  }

  createRequestForApartment(apartmentId: string, url: string) {
    return createRequestForApartment.call(this, apartmentId, url);
  }

  createRequestConfig(filter: FilterDto): AxiosRequestConfig {
    const rentOrSaleMap = {
      rent: 'stanovi-iznajmljivanje',
      sale: 'stanovi-prodaja',
    };

    const params = {
      productsSort: 'newnessDesc',
      currentPage: filter.pageNumber - 1,
      category: rentOrSaleMap[filter.rentOrSale],
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

  getResults = data => {
    const rentOrSaleMap = {
      'stanovi-iznajmljivanje': 'rent',
      'stanovi-prodaja': 'sale',
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

      const quidditaEnvironment = dom?.window?.QuidditaEnvironment;
      if (quidditaEnvironment && !quidditaEnvironment?.CurrentClassified)
        return true;
      if (
        [apartmentStatusPaused, apartmentStatusExpired].includes(
          quidditaEnvironment?.CurrentClassified?.StateId,
        )
      )
        return true;
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
    const microlocation = apartmentInfoLocation.find(
      address => address.type === 'MICROLOCATION',
    );
    let location;
    if (microlocation) {
      location = {
        latitude: microlocation.latitude,
        longitude: microlocation.longitude,
      };
    }
    const municipality = apartmentInfoLocation.find(
      address => address.type === 'SUBLOCATION',
    );
    const { highlightedAttributes: attributes } = apartmentInfo;
    const size = attributes.find(attribute => attribute.name === 'Površina')
      ?.featureValues[0].value;

    return {
      id: `${this.providerName}_${apartmentId}`,
      apartmentId,
      providerName: this.providerName,
      address: microlocation?.name,
      coverPhotoUrl: apartmentInfo.images.find(
        image => image.format === 'smThumbnailFormat',
      )?.url,
      floor: '2',
      heatingTypes: [],
      municipality: municipality.name,
      place: microlocation?.name,
      postedAt: new Date(apartmentInfo.originalPublishedDate),
      price: apartmentInfo.price?.value,
      rentOrSale: apartmentInfo.rentOrSale,
      size: size && Number(size),
      structure: 2,
      url: this.domainUrl + '/p' + apartmentInfo.url,
    };
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
      const apartmentData = JSON.parse(
        dom?.window?.document.getElementById('HybrisClassifiedProductExtended')
          .value,
      );

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
      const classificationCode = `general_flats_${apartmentInfo.rentOrSale}`;
      const features = apartmentData?.product?.classifications?.find(
        classification => classification?.code === classificationCode,
      ).features;
      const getFeatureValue = (code: string): string =>
        features?.find(feature => feature.code === code).featureValues?.[0]
          ?.value;

      const advertiser = getFeatureValue(
        'smrsClassificationCatalog/1.0/general_flats_sale.advertiser',
      );
      const advertiserType = advertiserTypeMap[advertiser];
      const advertiserName = apartmentData?.vendorBasicInfoStatus?.name;

      const furnishedValue = getFeatureValue(
        'smrsClassificationCatalog/1.0/general_flats_rent.furnished',
      );
      const furnished = furnishedMap[furnishedValue];

      const structureValue = getFeatureValue(
        'smrsClassificationCatalog/1.0/general_flats_rent.estate_structure',
      );
      const structure = structureMap[structureValue];

      Object.assign(apartmentInfo, {
        ...(address && {
          address,
        }),
        ...(advertiserName && {
          advertiserName,
        }),
        ...(advertiserType && {
          advertiserType,
        }),
        ...(furnished && { furnished }),
        ...(structure && { structure }),
      });

      console.log('data', apartmentData);
    } catch (error) {
      this.logger.error(error);
    }
  };
}
