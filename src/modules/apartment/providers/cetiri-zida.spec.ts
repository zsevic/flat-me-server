import { RentOrSale } from 'modules/filter/filter.enums';
import { CetiriZidaProvider } from './cetiri-zida';

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
});
