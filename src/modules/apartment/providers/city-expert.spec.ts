import { RentOrSale } from 'modules/filter/filter.enums';
import { CityExpertProvider } from './city-expert';

describe('CityExpert', () => {
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
          structure: filter.structures,
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
      };
      const provider = new CityExpertProvider();

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
          structure: filter.structures,
          propIds: [],
          filed: [2],
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
      };
      const provider = new CityExpertProvider();

      const requestConfig = provider.createRequestConfig(filter);

      expect(requestConfig).toEqual(request);
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
});
