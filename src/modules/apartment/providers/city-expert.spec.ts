import { CityExpertProvider } from './city-expert';

describe('CityExpert', () => {
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
});
