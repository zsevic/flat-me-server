import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { DEFAULT_TIMEOUT, ECONNABORTED } from 'common/constants';
import { RentOrSale } from 'modules/filter/filter.enums';
import { HaloOglasiProvider } from './halo-oglasi';

jest.mock('axios');

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
});
