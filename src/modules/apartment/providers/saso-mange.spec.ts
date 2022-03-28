import { DEFAULT_TIMEOUT } from 'common/constants';
import { RentOrSale } from 'modules/filter/filter.enums';
import { SasoMangeProvider } from './saso-mange';

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
});
