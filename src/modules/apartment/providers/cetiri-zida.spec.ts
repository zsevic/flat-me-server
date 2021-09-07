import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { DEFAULT_TIMEOUT, ECONNABORTED } from 'common/constants';
import { RentOrSale } from 'modules/filter/filter.enums';
import { apartmentActivityBaseUrlForCetiriZida } from '../apartment.constants';
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
        'cetiriZida_id',
      );

      expect(isApartmentInactive).toEqual(true);
      expect(axios.get).toHaveBeenCalledWith(
        `${apartmentActivityBaseUrlForCetiriZida}/id`,
        {
          timeout: DEFAULT_TIMEOUT,
        },
      );
    });

    it('should return undefined when connection is aborted', async () => {
      const provider = new CetiriZidaProvider();
      // @ts-ignore
      axios.get.mockRejectedValue({
        code: ECONNABORTED,
      });

      const isApartmentInactive = await provider.isApartmentInactive(
        'cetiriZida_id',
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(
        `${apartmentActivityBaseUrlForCetiriZida}/id`,
        {
          timeout: DEFAULT_TIMEOUT,
        },
      );
    });

    it('should return undefined when connection is aborted', async () => {
      const provider = new CetiriZidaProvider();
      // @ts-ignore
      axios.get.mockRejectedValue(new Error('error'));

      const isApartmentInactive = await provider.isApartmentInactive(
        'cetiriZida_id',
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(
        `${apartmentActivityBaseUrlForCetiriZida}/id`,
        {
          timeout: DEFAULT_TIMEOUT,
        },
      );
    });

    it('should return undefined when apartment is active', async () => {
      const provider = new CetiriZidaProvider();
      // @ts-ignore
      axios.get.mockResolvedValue(undefined);

      const isApartmentInactive = await provider.isApartmentInactive(
        'cetiriZida_id',
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(
        `${apartmentActivityBaseUrlForCetiriZida}/id`,
        {
          timeout: DEFAULT_TIMEOUT,
        },
      );
    });
  });

  describe('parseApartmentInfo', () => {
    it('should return parsed apartment info', () => {
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
        agencyAvatarUrlTemplate: 'url',
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
        postedAt: '2021-05-10T16:07:58+02:00',
        rentOrSale: 'rent',
        size: 69,
        structure: 3,
        url: 'https://4zida.rs/url',
      };

      const provider = new CetiriZidaProvider();

      const result = provider.parseApartmentInfo(apartmentInfo);

      expect(result).toEqual(parsedApartmentInfo);
    });
  });
});
