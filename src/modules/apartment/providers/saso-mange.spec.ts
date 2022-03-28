import axios from 'axios';
import jsdom from 'jsdom';
import { DEFAULT_TIMEOUT, ECONNABORTED, ECONNRESET } from 'common/constants';
import { RentOrSale } from 'modules/filter/filter.enums';
import { SasoMangeProvider } from './saso-mange';
import { ApartmentStatus, CategoryCode } from './saso-mange.enums';
import { HttpStatus } from '@nestjs/common';

jest.mock('axios');
jest.mock('jsdom');

describe('SasoMange', () => {
  describe('createRequestConfig', () => {
    const url = 'https://sasomange.rs/hybris/classified/v1/products/extended';
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
      const filterParams = `flat_type_${filter.rentOrSale}:Stan+u+zgradi,priceValue:(${filter.minPrice}-${filter.maxPrice}),location:beograd-palilula,flats_structure_${filter.rentOrSale}:garsonjera,flats_structure_${filter.rentOrSale}:jednosoban,flats_structure_${filter.rentOrSale}:jednoiposoban`;
      const request = {
        method: 'GET',
        params: {
          productsSort: 'newnessDesc',
          currentPage: filter.pageNumber - 1,
          category: 'stanovi-iznajmljivanje',
          productsFacetsFlattened: filterParams,
        },
        url,
        timeout: DEFAULT_TIMEOUT,
      };
      const provider = new SasoMangeProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
    });

    it('should return request config for sale', () => {
      const filter = {
        advertiserTypes: [],
        rentOrSale: RentOrSale.sale,
        municipalities: ['Novi Beograd', 'Stari Grad'],
        structures: [2.5],
        furnished: ['furnished', 'empty'],
        minPrice: 200,
        maxPrice: 300,
        pageNumber: 2,
      };
      const filterParams = `flat_type_${filter.rentOrSale}:Stan+u+zgradi,priceValue:(${filter.minPrice}-${filter.maxPrice}),location:beograd-novi-beograd,flats_structure_${filter.rentOrSale}:dvoiposoban`;
      const request = {
        method: 'GET',
        params: {
          productsSort: 'newnessDesc',
          currentPage: filter.pageNumber - 1,
          category: 'stanovi-prodaja',
          productsFacetsFlattened: filterParams,
        },
        url,
        timeout: DEFAULT_TIMEOUT,
      };
      const provider = new SasoMangeProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
    });
  });

  describe('createRequestConfigForApartment', () => {
    it('should throw an error when url for apartment is missing', () => {
      const provider = new SasoMangeProvider();

      expect(() =>
        provider.createRequestConfigForApartment('id', null),
      ).toThrowError();
    });

    it('should create request config for given apartment', () => {
      const provider = new SasoMangeProvider();
      const config = {
        url: 'url',
        method: 'GET',
        timeout: DEFAULT_TIMEOUT,
      };

      expect(
        provider.createRequestConfigForApartment('id', config.url),
      ).toEqual(config);
    });
  });

  describe('getResults', () => {
    it('should return the results from the provider', () => {
      const url = 'url';
      const ads = [
        {
          rentOrSale: RentOrSale.rent,
          url,
        },
      ];
      const data = {
        products: {
          products: [
            {
              url,
            },
          ],
          categoryCode: CategoryCode.Rent,
        },
      };
      const provider = new SasoMangeProvider();

      const results = provider.getResults(data);

      expect(results).toEqual(ads);
    });
  });

  describe('hasNextPage', () => {
    it('should return true when provider has next page', () => {
      const data = {
        products: {
          pagination: {
            currentPage: 3,
            totalPages: 6,
          },
        },
      };

      const provider = new SasoMangeProvider();
      const hasNextPage = provider.hasNextPage(data);

      expect(hasNextPage).toEqual(true);
    });

    it("should return false when provider doesn't have next page", () => {
      const data = {
        products: {
          pagination: {
            currentPage: 5,
            totalPages: 6,
          },
        },
      };

      const provider = new SasoMangeProvider();
      const hasNextPage = provider.hasNextPage(data);

      expect(hasNextPage).toEqual(false);
    });
  });

  describe('isApartmentInactive', () => {
    const id = 'id';
    const url = 'url';
    const providerPrefix = 'sasoMange';

    it('should return undefined when url is missing', async () => {
      const provider = new SasoMangeProvider();

      const isApartmentInactive = await provider.isApartmentInactive('id');

      expect(isApartmentInactive).toEqual(undefined);
    });

    it('should return true when apartment is not found', async () => {
      const provider = new SasoMangeProvider();
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
      const provider = new SasoMangeProvider();
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

    it('should return undefined when connection is aborted', async () => {
      const provider = new SasoMangeProvider();
      // @ts-ignore
      axios.get.mockRejectedValue({
        code: ECONNRESET,
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
      const provider = new SasoMangeProvider();
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
      const provider = new SasoMangeProvider();
      // @ts-ignore
      axios.get.mockResolvedValue({
        data: 'html',
        request: { res: { responseUrl: url } },
      });

      const dom = {
        window: {
          document: {
            getElementById() {
              return {
                value: `{"product":{"status": "${ApartmentStatus.Active}"}}`,
              };
            },
          },
        },
      };
      jsdom.JSDOM.mockReturnValue(dom);

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
        url,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(url, {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return true when apartment ad is redirected to other ad', async () => {
      const provider = new SasoMangeProvider();
      // @ts-ignore
      axios.get.mockResolvedValue({
        data: 'html',
        request: { res: { responseUrl: 'redirected-url' } },
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

    it('should return true when there is no apartment data', async () => {
      const provider = new SasoMangeProvider();
      // @ts-ignore
      axios.get.mockResolvedValue({
        data: 'html',
        request: { res: { responseUrl: url } },
      });

      const dom = {
        window: {},
      };
      jsdom.JSDOM.mockReturnValue(dom);

      const isApartmentInactive = await provider.isApartmentInactive(
        `${providerPrefix}_${id}`,
        url,
      );

      expect(isApartmentInactive).toEqual(undefined);
      expect(axios.get).toHaveBeenCalledWith(url, {
        timeout: DEFAULT_TIMEOUT,
      });
    });

    it('should return true when apartment is not active', async () => {
      const provider = new SasoMangeProvider();
      // @ts-ignore
      axios.get.mockResolvedValue({
        data: 'html',
        request: { res: { responseUrl: url } },
      });

      const dom = {
        window: {
          document: {
            getElementById() {
              return {
                value: '{"product":{"status": "PAUSED"}}',
              };
            },
          },
        },
      };
      jsdom.JSDOM.mockReturnValue(dom);

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
    it('should return mapped floor', () => {
      const provider = new SasoMangeProvider();

      expect(provider.parseFloor('floor_ground_floor')).toEqual('ground floor');
    });

    it('should return unmapped floor', () => {
      const provider = new SasoMangeProvider();
      const floor = '5';

      expect(provider.parseFloor(`floor_${floor}`)).toEqual(floor);
    });
  });
});
