import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { DEFAULT_TIMEOUT, ECONNABORTED } from 'common/constants';
import { RentOrSale } from 'modules/filter/filter.enums';
import {
  apartmentStatusFinished,
  apartmentStatusNotAvailable,
  apartmentStatusPublished,
  apartmentStatusReserved,
} from '../apartment.constants';
import { AdvertiserType } from '../enums/advertiser-type.enum';
import { CityExpertProvider } from './city-expert';

jest.mock('axios');
const apartmentRepository = {
  updateCurrentPrice: jest.fn(),
};

describe('CityExpert', () => {
  describe('createRequestConfig', () => {
    it('should return request config for rent', () => {
      const filter = {
        advertiserTypes: [],
        rentOrSale: RentOrSale.rent,
        municipalities: ['Palilula'],
        structures: [0.5, 1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
        pageNumber: 2,
      };
      const request = {
        url: 'https://cityexpert.rs/api/Search/',
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        data: {
          ptId: [1],
          cityId: 1,
          rentOrSale: 'r',
          currentPage: filter.pageNumber,
          resultsPerPage: 60,
          floor: [],
          avFrom: false,
          underConstruction: false,
          furnished: [2],
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
          structure: [0.5, 1.0, 1.5],
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
        },
        timeout: DEFAULT_TIMEOUT,
      };
      const provider = new CityExpertProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
    });

    it('should return request config for sale', () => {
      const filter = {
        advertiserTypes: [],
        rentOrSale: RentOrSale.sale,
        municipalities: ['Novi Beograd', 'Stari Grad'],
        structures: [2, 2.5],
        furnished: ['furnished', 'empty'],
        minPrice: 200,
        maxPrice: 300,
        pageNumber: 2,
      };
      const request = {
        url: 'https://cityexpert.rs/api/Search/',
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        data: {
          ptId: [1],
          cityId: 1,
          rentOrSale: 's',
          currentPage: filter.pageNumber,
          resultsPerPage: 60,
          floor: [],
          avFrom: false,
          underConstruction: false,
          furnished: [1, 3],
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
          structure: [2.0, 2.5],
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
        },
        timeout: DEFAULT_TIMEOUT,
      };
      const provider = new CityExpertProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
    });
  });

  describe('getApartmentUrl', () => {
    it('should throw an error when property type is not valid', async () => {
      const provider = new CityExpertProvider();

      expect(() =>
        provider.getApartmentUrl('cityExpert_3546-BZ'),
      ).toThrowError();
    });
  });

  describe('getResults', () => {
    it('should return the results from the provider', () => {
      const result = [];
      const data = {
        result,
      };
      const provider = new CityExpertProvider();

      const results = provider.getResults(data);

      expect(results).toEqual(result);
    });
  });

  describe('hasNextPage', () => {
    it('should return true when provider has next page', () => {
      const data = {
        info: {
          hasNextPage: true,
        },
      };

      const provider = new CityExpertProvider();
      const hasNextPage = provider.hasNextPage(data);

      expect(hasNextPage).toEqual(true);
    });

    it("should return false when provider doesn't have next page", () => {
      const data = {
        info: {
          hasNextPage: false,
        },
      };

      const provider = new CityExpertProvider();
      const hasNextPage = provider.hasNextPage(data);

      expect(hasNextPage).toEqual(false);
    });
  });

  describe('updateCurrentPriceAndReturnIsApartmentInactive', () => {
    const id = '3546-BR';
    const providerPrefix = 'cityExpert';

    it('should return undefined for invalid id', async () => {
      const provider = new CityExpertProvider();
      const isApartmentInactive = await provider.updateCurrentPriceAndReturnIsApartmentInactive(
        'id',
        // @ts-ignore
        apartmentRepository,
      );

      expect(isApartmentInactive).toEqual(undefined);
    });

    it('should return true for inactive apartment', async () => {
      const provider = new CityExpertProvider();
      // @ts-ignore
      axios.get.mockResolvedValue({
        data: {
          status: apartmentStatusFinished,
        },
      });

      const isApartmentInactive = await provider.updateCurrentPriceAndReturnIsApartmentInactive(
        `${providerPrefix}_${id}`,
        // @ts-ignore
        apartmentRepository,
      );

      expect(isApartmentInactive).toEqual(true);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return true for inactive apartment', async () => {
      const provider = new CityExpertProvider();
      // @ts-ignore
      axios.get.mockResolvedValue({
        data: {
          status: apartmentStatusNotAvailable,
        },
      });

      const isApartmentInactive = await provider.updateCurrentPriceAndReturnIsApartmentInactive(
        `${providerPrefix}_${id}`,
        // @ts-ignore
        apartmentRepository,
      );

      expect(isApartmentInactive).toEqual(true);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return true for inactive apartment', async () => {
      const provider = new CityExpertProvider();
      // @ts-ignore
      axios.get.mockResolvedValue({
        data: {
          status: apartmentStatusReserved,
        },
      });

      const isApartmentInactive = await provider.updateCurrentPriceAndReturnIsApartmentInactive(
        `${providerPrefix}_${id}`,
        // @ts-ignore
        apartmentRepository,
      );

      expect(isApartmentInactive).toEqual(true);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return true for inactive apartment', async () => {
      const provider = new CityExpertProvider();
      // @ts-ignore
      axios.get.mockRejectedValue({
        response: {
          status: HttpStatus.NOT_FOUND,
        },
      });

      const isApartmentInactive = await provider.updateCurrentPriceAndReturnIsApartmentInactive(
        `${providerPrefix}_${id}`,
        // @ts-ignore
        apartmentRepository,
      );

      expect(isApartmentInactive).toEqual(true);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should update the current price and return undefined when apartment is active', async () => {
      const provider = new CityExpertProvider();
      const currentPrice = 500;
      // @ts-ignore
      axios.get.mockResolvedValue({
        data: {
          status: apartmentStatusPublished,
          price: currentPrice,
        },
      });
      const apartmentId = `${providerPrefix}_${id}`;
      const apartmentRepositorySpy = jest.spyOn(
        apartmentRepository,
        'updateCurrentPrice',
      );

      const isApartmentInactive = await provider.updateCurrentPriceAndReturnIsApartmentInactive(
        apartmentId,
        // @ts-ignore
        apartmentRepository,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
      expect(apartmentRepositorySpy).toBeCalledWith(apartmentId, currentPrice);
    });

    it('should return undefined when request connection is aborted', async () => {
      const provider = new CityExpertProvider();
      // @ts-ignore
      axios.get.mockRejectedValue({
        code: ECONNABORTED,
      });

      const isApartmentInactive = await provider.updateCurrentPriceAndReturnIsApartmentInactive(
        `${providerPrefix}_${id}`,
        // @ts-ignore
        apartmentRepository,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });

  describe('parseApartmentInfo', () => {
    it('should return parsed apartment info', () => {
      const apartmentInfo = {
        uniqueID: '123-BS',
        propId: 123,
        statusId: 51,
        cityId: 1,
        location: '44.79498, 20.47002',
        street: 'Internacionalnih brigada',
        floor: 'VPR',
        size: 37,
        structure: '1.5',
        municipality: 'Vračar',
        polygons: ['Vračar'],
        ptId: 1,
        price: 450,
        coverPhoto: 'cover.jpg',
        rentOrSale: 's',
        caseId: 56305,
        caseType: 'BS',
        underConstruction: false,
        filed: 2,
        furnished: 2,
        ceiling: 2,
        furnishingArray: [],
        bldgOptsArray: [],
        heatingArray: [21],
        parkingArray: [5],
        yearOfConstruction: 1,
        joineryArray: [2],
        petsArray: [],
        otherArray: [],
        availableFrom: '0001-01-01T00:00:00Z',
        firstPublished: '2021-06-28T17:20:08Z',
        pricePerSize: 12.16,
      };
      const parsedApartmentInfo = {
        price: 450,
        id: 'cityExpert_123-BS',
        apartmentId: '123-BS',
        advertiserType: AdvertiserType.Owner,
        providerName: 'cityExpert',
        address: 'Internacionalnih Brigada',
        availableFrom: '0001-01-01T00:00:00Z',
        coverPhotoUrl:
          'https://img.cityexpert.rs/sites/default/files/styles/1920x/public/image/cover.jpg',
        advertiserName: 'City Expert',
        floor: 'high ground floor',
        furnished: 'semi-furnished',
        heatingTypes: ['underfloor'],
        location: { latitude: 44.79498, longitude: 20.47002 },
        municipality: 'Vračar',
        place: 'Vračar',
        postedAt: new Date('2021-06-28T17:20:08Z'),
        rentOrSale: 'sale',
        size: 37,
        structure: 1.5,
        url:
          'https://cityexpert.rs/prodaja/stan/123/jednoiposoban-internacionalnih-brigada-vračar',
      };
      const provider = new CityExpertProvider();

      const result = provider.parseApartmentInfo(apartmentInfo);

      expect(result).toEqual(parsedApartmentInfo);
    });
  });

  describe('parseFloor', () => {
    it('should return floor when totalFloor is undefined', () => {
      const provider = new CityExpertProvider();

      expect(provider.parseFloor('SU')).toEqual('basement');
    });

    it('should return floor when floor is not attic', () => {
      const provider = new CityExpertProvider();

      expect(provider.parseFloor('4', 5)).toEqual('4');
    });

    it('should return attic when floor is attic', () => {
      const provider = new CityExpertProvider();

      expect(provider.parseFloor('4', 4)).toEqual('attic');
    });
  });

  describe('updateApartmentInfo', () => {
    it('should update floor value with attic', () => {
      const provider = new CityExpertProvider();
      const apartmentInfo = {
        floor: 2,
      };
      const apartmentData = {
        floor: 2,
        onsite: {
          basInfFloorTotal: 2,
        },
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.floor).toEqual('attic');
    });

    it('should update floor value when total floors value is undefined', () => {
      const provider = new CityExpertProvider();
      const apartmentInfo = {
        floor: 2,
      };
      const apartmentData = {
        floor: 'SU',
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.floor).toEqual('basement');
    });

    it('should update advertiser type to investor when apartment is in development', () => {
      const provider = new CityExpertProvider();
      const apartmentInfo = {
        advertiserType: AdvertiserType.Owner,
      };
      const apartmentData = {
        newDevelopment: true,
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.advertiserType).toEqual(AdvertiserType.Investor);
    });

    it('should update floor value when total floors value is undefined', () => {
      const provider = new CityExpertProvider();
      const apartmentInfo = {
        floor: 2,
      };
      const apartmentData = {
        floor: 3,
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.floor).toEqual(apartmentData.floor);
    });

    it('should update place value when apartment data has a neighbourhood value', () => {
      const provider = new CityExpertProvider();
      const apartmentInfo = {
        place: 'Novi Beograd',
      };
      const apartmentData = {
        neighbourhoods: ['Ledine'],
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.place).toEqual(apartmentData.neighbourhoods[0]);
    });

    it("should skip updating place value when apartment data doesn't have a neighbourhood value", () => {
      const provider = new CityExpertProvider();
      const apartmentInfo = {
        place: 'Novi Beograd',
      };
      const apartmentData = {};

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.place).toEqual(apartmentInfo.place);
    });
  });
});
