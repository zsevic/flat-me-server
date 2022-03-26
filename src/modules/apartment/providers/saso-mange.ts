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
      price: apartmentInfo.price.value,
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
      console.log('info', apartmentInfo);
      const virtualConsole = new jsdom.VirtualConsole();
      const dom = new jsdom.JSDOM(apartmentDataHtml, {
        runScripts: 'dangerously',
        virtualConsole,
      });
    } catch (error) {
      this.logger.error(error);
    }
  };
}
