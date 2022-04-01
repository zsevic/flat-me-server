import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import jsdom from 'jsdom';
import { DEFAULT_TIMEOUT, ECONNABORTED, ECONNRESET } from 'common/constants';
import { RentOrSale } from 'modules/filter/filter.enums';
import { SasoMangeProvider } from './saso-mange';
import { ApartmentStatus, CategoryCode } from './saso-mange.enums';
import { Furnished } from '../enums/furnished.enum';
import { HeatingType } from '../enums/heating-type.enum';

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

  describe('parseApartmentInfo', () => {
    it('should return parsed apartment info', () => {
      const provider = new SasoMangeProvider();

      const apartmentInfo = {
        addresses: [
          {
            country: {
              host: true,
              name: 'Srbija',
            },
            location: [
              {
                code: 'beograd',
                hasChildren: true,
                latitude: 44.1234,
                longitude: 20.1234,
                name: 'Beograd',
                type: 'LOCATION',
              },
              {
                code: 'beograd-vracar',
                hasChildren: true,
                latitude: 44.1234,
                longitude: 20.1234,
                name: 'Vračar',
                parentCode: 'beograd',
                type: 'SUBLOCATION',
              },
              {
                code: 'beograd-vracar-crveni-krst',
                hasChildren: false,
                latitude: 44.1234,
                longitude: 20.5678,
                name: 'Crveni krst',
                parentCode: 'beograd-vracar',
                type: 'MICROLOCATION',
              },
            ],
          },
        ],
        code: 'izdavanje-stan-jednosoban-crveni-krst-swbgD',
        configurable: false,
        description: 'description',
        displayDate: '2022-03-13T10:02:09+02:00',
        highlightedAttributes: [
          {
            attributeType: 'number',
            code:
              'smrsClassificationCatalog/1.0/general_flats_rent.estate_area',
            coupled: false,
            editDisabled: false,
            featureUnit: {
              symbol: 'm²',
            },
            featureValues: [
              {
                name: '36',
                value: '36',
              },
            ],
            mandatory: true,
            name: 'Površina',
            range: true,
          },
          {
            attributeType: 'enum',
            code: 'smrsClassificationCatalog/1.0/general_flats_rent.flat_type',
            coupled: false,
            editDisabled: false,
            featureValues: [
              {
                name: 'Stan u zgradi',
                value: 'Stan u zgradi',
              },
            ],
            mandatory: false,
            name: 'Tip stana',
            range: false,
          },
        ],
        images: [
          {
            imageType: 'PRIMARY',
            format: 'smThumbnailFormat',
            url: 'url',
          },
        ],
        name: 'Izdavanje, Stan, Jednosoban, Crveni Krst, ID#24820',
        noDFP: false,
        numberOfGalleryImages: 8,
        numberOfMultimedia: 0,
        numberOfVisits: 378,
        originalPublishedDate: new Date('2021-11-08T08:59:19.000Z'),
        price: {
          priceType: 'BUY',
          currencyIso: 'EUR',
          formattedValue: '250,00 €',
          formattedValueWithoutCurrency: '250,00',
          value: 250,
        },
        priceRange: {},
        publishedDate: '2022-03-12T10:02:09+02:00',
        searchScore: 1,
        smSku: '1234321',
        url: '/1234321/izdavanje-stan-jednosoban-crveni-krst',
        vendor: {
          code: '00003F6N',
        },
        vendorSku: '24830',
        volumePricesFlag: false,
        rentOrSale: RentOrSale.rent,
      };
      const parsedApartmentInfo = {
        id: 'sasoMange_1234321',
        address: 'Crveni Krst',
        apartmentId: '1234321',
        coverPhotoUrl: 'url',
        floor: null,
        heatingTypes: null,
        location: {
          latitude: 44.1234,
          longitude: 20.5678,
        },
        municipality: 'Vračar',
        place: 'Crveni Krst',
        postedAt: new Date('2021-11-08T08:59:19.000Z'),
        price: 250,
        providerName: 'sasoMange',
        rentOrSale: RentOrSale.rent,
        size: 36,
        structure: null,
        url:
          'https://sasomange.rs/p/1234321/izdavanje-stan-jednosoban-crveni-krst',
      };

      const result = provider.parseApartmentInfo(apartmentInfo);

      expect(result).toEqual(parsedApartmentInfo);
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

  describe('updateApartmentInfo', () => {
    it('should update apartment info', () => {
      const product = {
        status: 'ACTIVE',
        addresses: [
          {
            country: {
              host: true,
              icon: {
                code: 'serbiaContainer',
                images: [
                  {
                    url: 'url',
                  },
                ],
              },
              inEU: false,
              isocode: 'RS',
              name: 'Srbija',
              phoneCode: '+381',
            },
            id: '12345',
            latitude: 44.1234,
            location: [
              {
                code: 'beograd',
                hasChildren: true,
                latitude: 44.1234,
                longitude: 20.1234,
                name: 'Beograd',
                type: 'LOCATION',
              },
              {
                code: 'beograd-vracar',
                hasChildren: true,
                latitude: 44.1234,
                longitude: 20.1234,
                name: 'Vračar',
                parentCode: 'beograd',
                type: 'SUBLOCATION',
              },
              {
                code: 'beograd-vracar-crveni-krst',
                hasChildren: false,
                latitude: 44.1234,
                longitude: 20.5678,
                name: 'Crveni krst',
                parentCode: 'beograd-vracar',
                type: 'MICROLOCATION',
              },
            ],
            longitude: 20.5678,
            radius: 0,
            streetName: '',
          },
        ],
        availableForPickup: false,
        breadcrumbs: [
          {
            facetCode: 'location',
            facetDisplayComponentType: 'locationSearchMultiselect',
            facetName: 'Lokacija',
            facetValueCode: 'beograd-vracar-crveni-krst',
            facetValueName: 'Beograd / Vračar / Crveni krst',
          },
          {
            facetCode: 'flats_structure_rent',
            facetDisplayComponentType: 'dropdownMultiSelect',
            facetName: 'Struktura',
            facetValueCode: 'jednosoban',
            facetValueName: 'Jednosoban',
          },
        ],
        categories: [
          {
            code: 'stanovi-iznajmljivanje',
            image: {
              format: 'smCategoryLogoDesktop',
              url: 'url',
            },
            name: 'Stanovi',
            url: '/stanovi-iznajmljivanje',
          },
        ],
        classifications: [
          {
            code: 'general_flats_rent',
            features: [
              {
                attributeType: 'enum',
                code:
                  'smrsClassificationCatalog/1.0/general_flats_rent.estate_structure',
                coupled: false,
                editDisabled: false,
                featureValues: [
                  {
                    name: 'Jednosoban',
                    value: 'one_room_estate_structure',
                  },
                ],
                mandatory: true,
                name: 'Struktura',
                range: false,
              },
              {
                attributeType: 'enum',
                code:
                  'smrsClassificationCatalog/1.0/general_flats_rent.furnished',
                coupled: false,
                editDisabled: false,
                featureValues: [
                  {
                    name: 'Namešteno',
                    value: 'furnished_full',
                  },
                ],
                mandatory: false,
                name: 'Nameštenost',
                range: false,
              },
              {
                attributeType: 'enum',
                code:
                  'smrsClassificationCatalog/1.0/general_flats_rent.land_heating',
                coupled: false,
                editDisabled: false,
                featureValues: [
                  {
                    name: 'Centralno',
                    value: 'land_heating_central',
                  },
                ],
                mandatory: false,
                name: 'Grejanje',
                range: false,
              },
              {
                attributeType: 'enum',
                code: 'smrsClassificationCatalog/1.0/general_flats_rent.floor',
                coupled: false,
                editDisabled: false,
                featureValues: [
                  {
                    name: '3',
                    value: 'floor_3',
                  },
                ],
                mandatory: false,
                name: 'Sprat',
                range: false,
              },
              {
                attributeType: 'number',
                code:
                  'smrsClassificationCatalog/1.0/general_flats_rent.number_storeys',
                coupled: false,
                editDisabled: false,
                featureValues: [
                  {
                    name: '3',
                    value: '3',
                  },
                ],
                mandatory: false,
                name: 'Spratnost',
                range: false,
              },
            ],
            name: 'Osnovne informacije',
          },
          {
            code: 'additional_flats',
            features: [
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Balkon',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Lođa',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Terasa',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Prednji vrt',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Garaža',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Podrum',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Garažno mesto',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Javni parking',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Spoljno parking mesto',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Rezervisan parking',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Špajz',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Ostava',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Garderober',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Recepcija',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Alarm',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Interfon',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Kamere',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Bazen',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Teretana',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Sauna',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'true',
                    value: 'true',
                  },
                ],
                name: 'Lift',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Prilaz za invalidska kolica',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Vešernica',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Voda',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Kanalizacija',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'U centru',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Blizu centra',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Klima',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Struja',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Salonac',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Duplex',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Penthouse',
                range: false,
              },
              {
                attributeType: 'boolean',
                featureValues: [
                  {
                    name: 'false',
                    value: 'false',
                  },
                ],
                name: 'Potkrovlje',
                range: false,
              },
            ],
            name: 'Dodatne informacije',
          },
        ],
        code: 'izdavanje-stan-jednosoban-crveni-krst',
        description: 'description',
        displayDate: '2022-03-14T10:02:09+02:00',
        highlightedAttributes: [
          {
            attributeType: 'number',
            code:
              'smrsClassificationCatalog/1.0/general_flats_rent.estate_area',
            coupled: false,
            editDisabled: false,
            featureUnit: {
              symbol: 'm²',
            },
            featureValues: [
              {
                name: '36',
                value: '36',
              },
              {
                name: '36',
                value: '36',
              },
            ],
            mandatory: true,
            name: 'Površina',
            range: true,
          },
          {
            attributeType: 'enum',
            code: 'smrsClassificationCatalog/1.0/general_flats_rent.flat_type',
            coupled: false,
            editDisabled: false,
            featureValues: [
              {
                name: 'Stan u zgradi',
                value: 'estate_type_flat',
              },
            ],
            mandatory: false,
            name: 'Tip stana',
            range: false,
          },
        ],
        images: [
          {
            imageType: 'PRIMARY',
            altText: 'Izdavanje, Stan, Jednosoban, Crveni Krst, ID#24820',
            format: 'smThumbnailFormat',
            url: 'url',
          },
        ],
        isAssignedToActivePromotions: false,
        lastModified: '2022-03-14T10:05:29+02:00',
        mainCategory: {
          code: 'stanovi-iznajmljivanje',
          image: {
            format: 'smCategoryLogoDesktop',
            url: 'url',
          },
          name: 'Stanovi',
          url: '/stanovi-iznajmljivanje',
        },
        name: 'Izdavanje, Stan, Jednosoban, Crveni Krst, ID#24820',
        noDFP: false,
        numberOfGalleryImages: 11,
        numberOfMultimedia: 0,
        numberOfVisits: 378,
        originalPublishedDate: '2021-11-08T09:59:19+01:00',
        phoneNumber: '+381 60 723 33 32',
        price: {
          priceType: 'BUY',
          currencyIso: 'EUR',
          formattedValue: '250,00 €',
          formattedValueWithoutCurrency: '250,00',
          value: 250,
        },
        priceRange: {},
        publishedDate: '2022-03-14T10:02:09+02:00',
        showMap: true,
        smSku: '1234321',
        url: '/1234321/izdavanje-stan-jednosoban-crveni-krst',
        vendor: {
          code: '00003U6H',
        },
        vendorSku: '20920',
        rentOrSale: RentOrSale.rent,
      };

      const dom = {
        window: {
          document: {
            getElementById() {
              return {
                value: JSON.stringify({
                  product,
                  vendorBasicInfoStatus: {
                    legalEntityName: 'agency name',
                  },
                }),
              };
            },
          },
        },
      };

      jsdom.JSDOM.mockReturnValue(dom);
      const apartmentInfo = {
        providerName: 'sasoMange',
        rentOrSale: RentOrSale.rent,
      };
      const updatedApartmentInfo = {
        advertiserName: 'Agency Name',
        floor: 'attic',
        furnished: Furnished.Full,
        heatingTypes: [HeatingType.District],
        location: {
          latitude: 44.1234,
          longitude: 20.5678,
        },
        providerName: 'sasoMange',
        rentOrSale: RentOrSale.rent,
        structure: 1,
      };

      const provider = new SasoMangeProvider();
      // @ts-ignore
      provider.updateApartmentInfo('html', apartmentInfo);

      expect(apartmentInfo).toEqual(updatedApartmentInfo);
    });
  });
});
