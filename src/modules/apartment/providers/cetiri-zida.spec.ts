import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { DEFAULT_TIMEOUT, ECONNABORTED } from 'common/constants';
import { RentOrSale } from 'modules/filter/filter.enums';
import { Apartment } from '../apartment.interface';
import { CetiriZidaProvider } from './cetiri-zida';

jest.mock('axios');

describe('CetiriZida', () => {
  describe('createRequestConfig', () => {
    it('should return request config for rent', () => {
      const filter = {
        rentOrSale: RentOrSale.rent,
        municipalities: ['Palilula'],
        structures: [0.5, 1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
        pageNumber: 2,
      };
      const request = {
        params: {
          for: 'rent',
          furnishedTypes: ['semi'],
          page: filter.pageNumber,
          placeIds: [28257],
          priceFrom: filter.minPrice,
          priceTo: filter.maxPrice,
          structures: [102, 101, 103],
        },
        url: 'https://api.4zida.rs/v6/search/apartments',
        timeout: DEFAULT_TIMEOUT,
      };
      const provider = new CetiriZidaProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
    });

    it('should return request config for sale', () => {
      const filter = {
        rentOrSale: RentOrSale.sale,
        municipalities: ['Novi Beograd', 'Stari Grad'],
        structures: [2.5],
        furnished: ['furnished', 'empty'],
        minPrice: 200,
        maxPrice: 300,
        pageNumber: 2,
      };
      const request = {
        params: {
          for: 'sale',
          furnishedTypes: ['yes', 'no'],
          page: filter.pageNumber,
          placeIds: [139],
          priceFrom: filter.minPrice,
          priceTo: filter.maxPrice,
          registered: 1,
          structures: [105],
        },
        url: 'https://api.4zida.rs/v6/search/apartments',
        timeout: DEFAULT_TIMEOUT,
      };
      const provider = new CetiriZidaProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
    });
  });

  describe('getResults', () => {
    it('should return the results from the provider', () => {
      const ads = [];
      const data = {
        ads,
      };
      const provider = new CetiriZidaProvider();

      const results = provider.getResults(data);

      expect(results).toEqual(ads);
    });
  });

  describe('hasNextPage', () => {
    it('should return true when provider has next page', () => {
      const pageNumber = 2;
      const data = {
        ads: [{}, {}, {}],
        total: 7,
      };

      const provider = new CetiriZidaProvider();
      const hasNextPage = provider.hasNextPage(data, pageNumber);

      expect(hasNextPage).toEqual(true);
    });

    it("should return false when provider doesn't have next page", () => {
      const pageNumber = 2;
      const data = {
        ads: [{}, {}, {}],
        total: 6,
      };

      const provider = new CetiriZidaProvider();
      const hasNextPage = provider.hasNextPage(data, pageNumber);

      expect(hasNextPage).toEqual(false);
    });
  });

  describe('isApartmentInactive', () => {
    const id = 'id';
    const providerPrefix = 'cetiriZida';

    it('should return undefined for invalid id', async () => {
      const provider = new CetiriZidaProvider();
      // @ts-ignore
      axios.get.mockRejectedValue('not valid');

      const isApartmentInactive = await provider.isApartmentInactive('id');

      expect(isApartmentInactive).toEqual(undefined);
    });

    it('should return true when apartment is not found', async () => {
      const provider = new CetiriZidaProvider();
      // @ts-ignore
      axios.get.mockRejectedValue({
        response: {
          status: HttpStatus.NOT_FOUND,
        },
      });

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
      );

      expect(isApartmentInactive).toEqual(true);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return undefined when connection is aborted', async () => {
      const provider = new CetiriZidaProvider();
      // @ts-ignore
      axios.get.mockRejectedValue({
        code: ECONNABORTED,
      });

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return undefined when error is thrown', async () => {
      const provider = new CetiriZidaProvider();
      // @ts-ignore
      axios.get.mockRejectedValue(new Error('error'));

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return undefined when apartment is active', async () => {
      const provider = new CetiriZidaProvider();
      // @ts-ignore
      axios.get.mockResolvedValue(undefined);

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(provider.getApartmentUrl(id), {
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });

  describe('parseApartmentInfo', () => {
    const apartmentInfo = {
      m2: 69,
      floor: -3,
      totalFloors: 3,
      furnished: 'yes',
      heatingType: 'thermalPump',
      id: 'id',
      for: 'rent',
      price: 420,
      previousPrice: 300,
      bookmarkCount: 3,
      registered: 'yes',
      address: 'Dalmatinska',
      allowedVirtualSightseeing: false,
      featuredExpiresAt: '2021-08-25T19:01:41+02:00',
      featuredCounter: 5,
      authorId: 57,
      createdAt: '2021-05-10T16:07:58+02:00',
      roomCount: 3,
      description100: 'description',
      type: 'apartment',
      structureName: 'Trosoban stan',
      structureAbbreviation: '3.0 stan',
      title: 'Dalmatinska',
      urlPath: '/url',
      placeNames: ['Zvezdara opština'],
      agencyUrl: 'url',
      image: { search: { '380x0_fill_0_webp': 'cover-photo-url' } },
      imageCount: 15,
    };
    const parsedApartmentInfo = {
      price: 420,
      id: 'cetiriZida_id',
      apartmentId: 'id',
      providerName: 'cetiriZida',
      address: 'Dalmatinska',
      coverPhotoUrl: 'cover-photo-url',
      floor: 'basement',
      furnished: 'furnished',
      heatingTypes: ['thermal pump'],
      municipality: 'Zvezdara',
      place: 'Zvezdara opština',
      postedAt: new Date('2021-05-10T16:07:58+02:00'),
      rentOrSale: 'rent',
      size: 69,
      structure: 3,
      url: 'https://4zida.rs/url',
    };

    it('should return parsed apartment info', () => {
      const provider = new CetiriZidaProvider();

      const result = provider.parseApartmentInfo(apartmentInfo);

      expect(result).toEqual(parsedApartmentInfo);
    });

    it('should return parsed apartment info with default heating types and advertiser name values', () => {
      const apartmentInfoWithNoHeatingTypes = {
        ...apartmentInfo,
        author: undefined,
        heatingType: undefined,
      };
      const parsedApartmentInfoWithDefaultHeatingTypes = {
        ...parsedApartmentInfo,
        advertiserName: undefined,
        heatingTypes: [],
      };

      const provider = new CetiriZidaProvider();

      const result = provider.parseApartmentInfo(
        apartmentInfoWithNoHeatingTypes,
      );

      expect(result).toEqual(parsedApartmentInfoWithDefaultHeatingTypes);
    });
  });

  describe('parseFloor', () => {
    it('should return floor when totalFloor is undefined', () => {
      const provider = new CetiriZidaProvider();

      expect(provider.parseFloor('-4')).toEqual('cellar');
    });

    it('should return floor when floor is not attic', () => {
      const provider = new CetiriZidaProvider();

      expect(provider.parseFloor('4', 5)).toEqual('4');
    });

    it('should return attic when floor is attic', () => {
      const provider = new CetiriZidaProvider();

      expect(provider.parseFloor('4', 4)).toEqual('attic');
    });
  });

  describe('updateApartmentInfo', () => {
    it('should add location info', () => {
      const provider = new CetiriZidaProvider();
      const apartmentInfo: Partial<Apartment> = {};
      const apartmentData = {
        latitude: 20,
        longitude: 40,
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.location.latitude).toEqual(apartmentData.latitude);
      expect(apartmentInfo.location.longitude).toEqual(apartmentData.longitude);
    });

    it('should update floor value with attic', () => {
      const provider = new CetiriZidaProvider();
      const apartmentInfo = {
        floor: 2,
      };
      const apartmentData = {
        floor: 2,
        totalFloors: 2,
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.floor).toEqual('attic');
    });

    it('should update floor value when total floors value is undefined', () => {
      const provider = new CetiriZidaProvider();
      const apartmentInfo = {
        floor: 2,
      };
      const apartmentData = {
        floor: '-4',
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.floor).toEqual('cellar');
    });

    it('should update floor value when total floors value is undefined', () => {
      const provider = new CetiriZidaProvider();
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

    it("shouldn't update advertiser name field when there is no value for it", () => {
      const provider = new CetiriZidaProvider();
      const apartmentInfo = {
        advertiserName: 'agency',
      };
      const apartmentData = {};

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.advertiserName).toEqual(
        apartmentInfo.advertiserName,
      );
    });

    it('should update advertiser name field when new value is defined', () => {
      const provider = new CetiriZidaProvider();
      const apartmentInfo = {
        advertiserName: 'agency',
      };
      const apartmentData = {
        author: {
          agency: {
            title: 'new agency',
          },
        },
      };

      // @ts-ignore
      provider.updateApartmentInfo(apartmentData, apartmentInfo);

      expect(apartmentInfo.advertiserName).toEqual(
        apartmentData.author.agency.title,
      );
    });
  });
});
