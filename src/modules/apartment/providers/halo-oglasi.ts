import { HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import jsdom from 'jsdom';
import latinize from 'latinize';
import { DEFAULT_TIMEOUT, ECONNABORTED, ECONNRESET } from 'common/constants';
import { capitalizeWords } from 'common/utils';
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
import { Floor } from '../enums/floor.enum';
import { Furnished } from '../enums/furnished.enum';
import { HeatingType } from '../enums/heating-type.enum';

export class HaloOglasiProvider implements Provider {
  private readonly providerName = 'haloOglasi';
  private readonly rentOrSaleMapForUrl = {
    rent: 'izdavanje',
    sale: 'prodaja',
  };

  private readonly atticKey = 'PTK';
  private readonly floor = {
    SUT: Floor.Basement,
    PSUT: Floor.SemiBasement,
    PR: Floor.GroundFloor,
    VPR: Floor.HighGroundFloor,
    [this.atticKey]: Floor.Attic,
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
      [Furnished.Full]: 562,
      [Furnished.Semi]: 563,
      [Furnished.Empty]: 564,
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
    try {
      const virtualConsole = new jsdom.VirtualConsole();
      const htmlWithApartmentList = html.replace(
        'QuidditaEnvironment.serverListData',
        'var serverListData=QuidditaEnvironment.serverListData',
      );
      const dom = new jsdom.JSDOM(htmlWithApartmentList, {
        runScripts: 'dangerously',
        virtualConsole,
      });

      const apartmentList = dom?.window?.serverListData?.Ads || [];
      return apartmentList
        .filter(apartment => !!apartment.RelativeUrl)
        .map(apartment => {
          const [relativeUrl] = apartment.RelativeUrl.split('?');
          return {
            rentOrSale: filter.rentOrSale,
            url: this.domainUrl + relativeUrl,
          };
        });
    } catch (error) {
      // skipping error html.replace is a not function
      if (!(error instanceof TypeError)) {
        this.logger.error(error);
      }
      return [];
    }
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
        562: Furnished.Full,
        563: Furnished.Semi,
        564: Furnished.Empty,
      };

      const heatingTypesMap: Record<number, string> = {
        1542: HeatingType.District,
        1543: HeatingType.Electricity,
        1544: HeatingType.StorageHeater,
        1545: HeatingType.Gas,
        1546: HeatingType.Underfloor,
        1547: HeatingType.TileStove,
        1548: HeatingType.NorwegianRadiators,
        1549: HeatingType.MarbleRadiators,
        1550: HeatingType.ThermalPump,
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

      const advertiserTypeMap = {
        Agencija: AdvertiserType.Agency,
        Investitor: AdvertiserType.Investor,
        Vlasnik: AdvertiserType.Owner,
      };

      const advertiser = apartmentData.oglasivac_nekretnine_s;
      const advertiserName =
        advertiser === 'Agencija' &&
        advertiserData?.DisplayName?.replace(/&quot;/g, '"');
      const advertiserType = advertiserTypeMap[advertiser];
      const address = latinize(apartmentData.ulica_t);
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
      const postedAt = apartmentData.ValidFrom;
      const price = apartmentData.cena_d;
      const size = apartmentData.kvadratura_d;
      const structure =
        apartmentData?.broj_soba_s !== '5+' &&
        Number(apartmentData.broj_soba_s);

      Object.assign(apartmentInfo, {
        ...(address && { address: capitalizeWords(address) }),
        ...(advertiserName && { advertiserName }),
        ...(advertiserType && { advertiserType }),
        ...(photosUrls?.length > 0 && {
          coverPhotoUrl: this.imageBaseUrl + photosUrls[0],
        }),
        ...(floor && { floor }),
        ...(furnished && { furnished }),
        heatingTypes,
        ...(location && { location }),
        ...(municipality && { municipality }),
        ...(place && { place: capitalizeWords(place) }),
        ...(postedAt && { postedAt: new Date(postedAt) }),
        ...(price && { price }),
        ...(size && { size }),
        ...(structure && { structure }),
      });
    } catch (error) {
      this.logger.error(error);
    }
  };
}
