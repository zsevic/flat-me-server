import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import jsdom from 'jsdom';
import { DEFAULT_TIMEOUT, ECONNABORTED } from 'common/constants';
import { RentOrSale } from 'modules/filter/filter.enums';
import { HaloOglasiProvider } from './halo-oglasi';

jest.mock('axios');
jest.mock('jsdom');

describe('HaloOglasi', () => {
  describe('createRequestConfig', () => {
    it('should return request config for rent', () => {
      const filter = {
        rentOrSale: RentOrSale.rent,
        municipalities: ['Palilula', 'Novi Beograd'],
        structures: [],
        furnished: ['furnished', 'semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
        pageNumber: 2,
      };
      const request = {
        params: {
          'grad_id_l-lokacija_id_l-mikrolokacija_id_l': '40761,40574',
          cena_d_from: filter.minPrice,
          cena_d_to: filter.maxPrice,
          cena_d_unit: 4,
          namestenost_id_l: '562,563',
          page: filter.pageNumber,
        },
        url: 'https://www.halooglasi.com/nekretnine/izdavanje-stanova',
        method: 'GET',
        timeout: DEFAULT_TIMEOUT,
      };
      const provider = new HaloOglasiProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
    });

    it('should return request config for sale', () => {
      const filter = {
        rentOrSale: RentOrSale.sale,
        municipalities: ['Palilula'],
        structures: [],
        furnished: [],
        minPrice: 200,
        maxPrice: 300,
        pageNumber: 2,
      };
      const request = {
        params: {
          'grad_id_l-lokacija_id_l-mikrolokacija_id_l': 40761,
          cena_d_from: filter.minPrice,
          cena_d_to: filter.maxPrice,
          cena_d_unit: 4,
          page: filter.pageNumber,
        },
        url: 'https://www.halooglasi.com/nekretnine/prodaja-stanova',
        method: 'GET',
        timeout: DEFAULT_TIMEOUT,
      };
      const provider = new HaloOglasiProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
    });
  });

  describe('createRequestConfigForApartment', () => {
    it('should throw an error when url for apartment is missing', () => {
      const provider = new HaloOglasiProvider();

      expect(() =>
        provider.createRequestConfigForApartment('id', null),
      ).toThrowError();
    });

    it('should create request config for given apartment', () => {
      const provider = new HaloOglasiProvider();
      const config = {
        url: 'url',
        method: 'GET',
      };

      expect(
        provider.createRequestConfigForApartment('id', config.url),
      ).toEqual(config);
    });
  });

  describe('getResults', () => {
    it("should return empty apartment list when apartments can't be parsed from html", () => {
      const apartmentUrl = '/url';
      const html = `<div><a href="${apartmentUrl}">link</a></div>`;
      const result = [];

      const provider = new HaloOglasiProvider();
      // @ts-ignore
      const apartmentList = provider.getResults(html, { rentOrSale: 'rent' });

      expect(apartmentList).toEqual(result);
    });

    it('should return apartment list', () => {
      const apartmentUrl = '/url';
      const html = `<div class="product-title"><a href="${apartmentUrl}">link</a></div>`;
      const result = [
        {
          url: 'https://www.halooglasi.com' + apartmentUrl,
          rentOrSale: 'rent',
        },
      ];

      const provider = new HaloOglasiProvider();
      // @ts-ignore
      const apartmentList = provider.getResults(html, { rentOrSale: 'rent' });

      expect(apartmentList).toEqual(result);
    });
  });

  describe('hasNextPage', () => {
    it('should return true', () => {
      const provider = new HaloOglasiProvider();

      expect(provider.hasNextPage()).toEqual(true);
    });
  });

  describe('isApartmentInactive', () => {
    const id = 'id';
    const url = 'url';
    const providerPrefix = 'haloOglasi';

    it('should return undefined when url is missing', async () => {
      const provider = new HaloOglasiProvider();

      const isApartmentInactive = await provider.isApartmentInactive('id');

      expect(isApartmentInactive).toEqual(undefined);
    });

    it('should return true when apartment is not found', async () => {
      const provider = new HaloOglasiProvider();
      // @ts-ignore
      axios.get.mockRejectedValue({
        response: {
          status: HttpStatus.NOT_FOUND,
        },
      });

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
        url,
      );

      expect(isApartmentInactive).toEqual(true);
      expect(axios.get).toHaveBeenCalledWith(url, {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return undefined when connection is aborted', async () => {
      const provider = new HaloOglasiProvider();
      // @ts-ignore
      axios.get.mockRejectedValue({
        code: ECONNABORTED,
      });

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
        url,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(url, {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return undefined when error is thrown', async () => {
      const provider = new HaloOglasiProvider();
      // @ts-ignore
      axios.get.mockRejectedValue(new Error('error'));

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
        url,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(url, {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return undefined when apartment is active', async () => {
      const provider = new HaloOglasiProvider();
      // @ts-ignore
      axios.get.mockResolvedValue(undefined);

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
        url,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(url, {
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });

  describe('parseFloor', () => {
    it('should return floor when totalFloor is undefined', () => {
      const provider = new HaloOglasiProvider();

      expect(provider.parseFloor('SUT')).toEqual('basement');
    });

    it('should return floor when floor is not attic', () => {
      const provider = new HaloOglasiProvider();

      expect(provider.parseFloor('4', 5)).toEqual('4');
    });

    it('should return attic when floor is attic', () => {
      const provider = new HaloOglasiProvider();

      expect(provider.parseFloor('4', 4)).toEqual('attic');
    });
  });

  describe('parseApartmentInfo', () => {
    it('should return parsed apartment info', () => {
      const provider = new HaloOglasiProvider();

      const apartmentInfo = {
        url: 'url/id',
      };
      const parsedApartmentInfo = {
        id: 'haloOglasi_id',
        apartmentId: 'id',
        providerName: 'haloOglasi',
        url: apartmentInfo.url,
      };

      const result = provider.parseApartmentInfo(apartmentInfo);

      expect(result).toEqual(parsedApartmentInfo);
    });
  });

  describe('updateApartmentInfo', () => {
    it('should update apartment info', () => {
      const dom = {
        window: {
          QuidditaEnvironment: {
            CurrentClassified: {
              broj_soba_s: 1.5,
              cena_d: 250,
              grejanje_id_l: 1542,
              kvadratura_d: 43,
              lokacija_id_l: 40769,
              mikrolokacija_s: 'Lion',
              namestenost_id_l: 562,
              oglasivac_nekretnine_s: 'Agencija',
              sprat_s: 2,
              sprat_od_s: 5,
              ulica_t: 'street 23',
              GeoLocationRPT: '40,20',
              ImageURLs: ['/image-url'],
              ValidFrom: '2021-12-03T11:13:53Z',
            },
            CurrentContactData: {
              Advertiser: {
                DisplayName: 'Agencija',
              },
            },
          },
        },
      };
      jsdom.JSDOM.mockReturnValue(dom);
      const apartmentInfo = {};
      const updatedApartmentInfo = {
        address: 'Street 23',
        advertiserName: 'Agencija',
        coverPhotoUrl: 'https://img.halooglasi.com/image-url',
        floor: 2,
        furnished: 'furnished',
        heatingTypes: ['district'],
        location: { latitude: 40, longitude: 20 },
        municipality: 'Rakovica',
        place: 'Lion',
        postedAt: '2021-12-03T11:13:53Z',
        price: 250,
        size: 43,
        structure: 1.5,
      };

      const provider = new HaloOglasiProvider();
      // @ts-ignore
      provider.updateApartmentInfo('html', apartmentInfo);

      expect(apartmentInfo).toEqual(updatedApartmentInfo);
    });
  });
});
