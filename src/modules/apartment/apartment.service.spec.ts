import { Test, TestingModule } from '@nestjs/testing';
import { RentOrSale } from 'modules/filter/filter.enums';
import { UserService } from 'modules/user/user.service';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentService } from './apartment.service';
import {
  BaseProvider,
  CetiriZidaProvider,
  CityExpertProvider,
} from './providers';

const apartmentRepository = {
  deleteApartment: jest.fn(),
  findOne: jest.fn(),
  getApartmentList: jest.fn(),
  saveApartmentList: jest.fn(),
  updateLastCheckedDatetime: jest.fn(),
};

const cetiriZidaProvider = new CetiriZidaProvider();

const baseProvider = {
  providers: {
    cetiriZida: CetiriZidaProvider,
    cityExpert: CityExpertProvider,
  },
  createProvider: jest.fn(),
  getProviderRequest: jest.fn(),
  getProviderRequests: jest.fn(),
  getProviderResults: jest.fn(),
};

const agencyAvatarUrlTemplate =
  'https://resizer.4zida.rs/unsigned/{{mode}}/{{height}}/{{width}}/ce/0/plain/local:///agencies/0aa1c17d3c.jpeg@{{format}}';

describe('ApartmentService', () => {
  let apartmentService: ApartmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApartmentService,
        {
          provide: BaseProvider,
          useValue: baseProvider,
        },
        {
          provide: ApartmentRepository,
          useValue: apartmentRepository,
        },
        {
          provide: UserService,
          useValue: {},
        },
      ],
    }).compile();

    apartmentService = module.get<ApartmentService>(ApartmentService);
  });

  describe('getApartmentListFromDatabaseByFilter', () => {
    it('should return apartment list from the database by given filter', async () => {
      const apartments = [{ id: 'id1' }];
      const apartmentsIds = ['id1'];
      const filter = {
        id: 'f7188f2f-ee2d-4bcc-a439-1461abae0ff0',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        userId: '31dbc67a-411b-448e-9c22-497563055120',
        user: {
          id: 'userid',
          email: 'test@example.com',
          apartments,
          isVerified: true,
          subscription: 'FREE',
        },
        createdAt: new Date('2021-08-18T00:52:18.296Z'),
        isActive: true,
        isVerified: true,
      };
      const apartmentList = [
        {
          heatingTypes: ['central'],
          id: 'cetiriZida_id1',
          price: 350,
          apartmentId: 'id',
          providerName: 'cetiriZida',
          address: 'street',
          coverPhotoUrl: 'url',
          floor: 'ground floor',
          furnished: 'semi-furnished',
          municipality: 'Savski venac',
          place: 'Sarajevska',
          postedAt: new Date('2021-06-23T13:38:19+02:00'),
          rentOrSale: 'rent',
          size: 41,
          structure: 3,
          url: 'url',
          createdAt: '2021-08-14T18:12:32.133Z',
          updatedAt: '2021-08-14T18:12:32.133Z',
        },
      ];
      const limitPerPage = 5;
      const apartmentListParams = {
        ...filter,
        limitPerPage,
        pageNumber: 1,
      };
      jest
        .spyOn(apartmentRepository, 'getApartmentList')
        .mockResolvedValue(apartmentList);

      await apartmentService.getApartmentListFromDatabaseByFilter(
        // @ts-ignore
        filter,
        limitPerPage,
      );

      expect(apartmentRepository.getApartmentList).toHaveBeenCalledWith(
        apartmentListParams,
        apartmentsIds,
        filter.createdAt,
      );
    });
  });

  describe('handleDeletingInactiveApartment', () => {
    it('should skip checking and deleting apartment when apartment has been checked recently', async () => {
      const apartmentId = 'apartmentid';
      const isApartmentInactiveSpy = jest
        .spyOn(apartmentService, 'isApartmentInactive')
        .mockResolvedValue(false);
      const deleteApartmentSpy = jest.spyOn(
        apartmentService,
        'deleteApartment',
      );
      const FIVE_SECONDS = 1000 * 5;
      const lastCheckedAt = new Date(Date.now() - FIVE_SECONDS);

      await apartmentService.handleDeletingInactiveApartment(
        apartmentId,
        lastCheckedAt,
      );

      expect(isApartmentInactiveSpy).not.toBeCalled();
      expect(deleteApartmentSpy).not.toBeCalled();
    });

    it('should skip deleting apartment when apartment is active', async () => {
      const apartmentId = 'apartmentid';
      const isApartmentInactiveSpy = jest
        .spyOn(apartmentService, 'isApartmentInactive')
        .mockResolvedValue(false);
      const deleteApartmentSpy = jest.spyOn(
        apartmentService,
        'deleteApartment',
      );
      const TEN_MINUTES = 1000 * 60 * 10;
      const lastCheckedAt = new Date(Date.now() - TEN_MINUTES);

      await apartmentService.handleDeletingInactiveApartment(
        apartmentId,
        lastCheckedAt,
      );

      expect(isApartmentInactiveSpy).toBeCalledWith(apartmentId, undefined);
      expect(deleteApartmentSpy).not.toBeCalled();
    });

    it('should delete inactive apartment', async () => {
      const apartmentId = 'apartmentid';
      const isApartmentInactiveSpy = jest
        .spyOn(apartmentService, 'isApartmentInactive')
        .mockResolvedValue(true);
      const deleteApartmentSpy = jest.spyOn(
        apartmentService,
        'deleteApartment',
      );
      const TEN_MINUTES = 1000 * 60 * 10;
      const lastCheckedAt = new Date(Date.now() - TEN_MINUTES);

      await apartmentService.handleDeletingInactiveApartment(
        apartmentId,
        lastCheckedAt,
      );

      expect(isApartmentInactiveSpy).toBeCalledWith(apartmentId, undefined);
      expect(deleteApartmentSpy).toBeCalledWith(apartmentId);
    });
  });

  describe('isApartmentInactive', () => {
    it('should skip deleting apartment when apartment is active', async () => {
      const apartmentId = '1234';
      const providerName = 'cetiriZida';
      const id = `${providerName}_${apartmentId}`;
      jest
        .spyOn(baseProvider, 'createProvider')
        .mockReturnValue(cetiriZidaProvider);
      jest
        .spyOn(cetiriZidaProvider, 'isApartmentInactive')
        .mockResolvedValue(false);

      const isApartmentInactive = await apartmentService.isApartmentInactive(
        id,
      );

      expect(isApartmentInactive).toEqual(false);
      expect(baseProvider.createProvider).toHaveBeenCalledWith(providerName);
    });

    it('should skip deleting inactive apartment when provider name is not valid', async () => {
      const apartmentId = '1234';
      const providerName = 'testProvider';
      const id = `${providerName}_${apartmentId}`;
      jest
        .spyOn(baseProvider, 'createProvider')
        .mockImplementation(new BaseProvider().createProvider);

      const isApartmentInactive = await apartmentService.isApartmentInactive(
        id,
      );

      expect(isApartmentInactive).toEqual(false);
      expect(baseProvider.createProvider).toHaveBeenCalledWith(providerName);
    });

    it('should delete inactive apartment', async () => {
      const apartmentId = '1234';
      const providerName = 'cetiriZida';
      const id = `${providerName}_${apartmentId}`;
      jest
        .spyOn(baseProvider, 'createProvider')
        .mockReturnValue(cetiriZidaProvider);
      jest
        .spyOn(cetiriZidaProvider, 'isApartmentInactive')
        .mockResolvedValue(true);

      const isApartmentInactive = await apartmentService.isApartmentInactive(
        id,
      );

      expect(isApartmentInactive).toEqual(true);
      expect(baseProvider.createProvider).toHaveBeenCalledWith(providerName);
    });
  });

  describe('isCheckableApartment', () => {
    it('should return true when last checking was more than 5 minutes ago', () => {
      expect(
        apartmentService.isCheckableApartment(
          new Date(Date.now() + 1000 * 60 * 10),
        ),
      );
    });

    it('should return false when last checking was less than 5 minutes ago', () => {
      expect(
        apartmentService.isCheckableApartment(
          new Date(Date.now() + 1000 * 60 * 2),
        ),
      );
    });
  });

  describe('saveApartmentListFromProviders', () => {
    const cetiriZidaProvider = new CetiriZidaProvider();
    const cityExpertProvider = new CityExpertProvider();

    it('should find, paginate and save apartments from providers', async () => {
      const firstProviderResults = [
        {
          total: 2,
          ads: [
            {
              m2: 69,
              floor: 1,
              totalFloors: 3,
              furnished: 'yes',
              heatingType: 'district',
              id: '60993e3e7906cd3a4c6832fd',
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
              agencyAvatarUrlTemplate,
              agencyUrl: 'url',
              image: { search: { '380x0_fill_0_webp': 'cover-photo-url' } },
              imageCount: 15,
            },
          ],
        },
        {
          info: {
            hasNextPage: true,
          },
          result: [
            {
              uniqueID: '23-BR',
              propId: 23,
              statusId: 51,
              cityId: 1,
              location: '45.79825, 21.48652',
              street: 'Cara Nikolaja II',
              floor: 'VPR',
              size: 33,
              structure: '1.5',
              municipality: 'Vračar',
              polygons: ['Vračar'],
              ptId: 1,
              price: 450,
              coverPhoto: 'url.jpg',
              rentOrSale: 'r',
              caseId: 57364,
              caseType: 'BR',
              underConstruction: false,
              filed: 0,
              furnished: 1,
              ceiling: 2,
              furnishingArray: [],
              bldgOptsArray: [],
              heatingArray: [1],
              parkingArray: [5],
              yearOfConstruction: 2,
              joineryArray: [2],
              petsArray: [3],
              otherArray: [],
              availableFrom: '2021-08-09T11:04:13Z',
              firstPublished: '2021-08-09T09:22:38Z',
              pricePerSize: 13.636364,
            },
          ],
        },
      ];
      const secondProviderResults = [
        {
          total: 2,
          ads: [
            {
              m2: 62,
              floor: 3,
              totalFloors: 5,
              furnished: 'yes',
              heatingType: 'district',
              id: '60f99390d9982b10',
              for: 'rent',
              price: 500,
              address: 'Kursulina',
              deposit: 1,
              paymentTerm: 'month',
              allowedVirtualSightseeing: false,
              featuredExpiresAt: '2021-08-24T09:38:53+02:00',
              featuredCounter: 3,
              authorId: 149,
              createdAt: '2020-04-22T17:49:36+02:00',
              roomCount: 3,
              description100: 'description',
              type: 'apartment',
              structureName: 'Dvosoban stan',
              structureAbbreviation: '2.0 stan',
              title: 'Hram Svetog Save',
              urlPath: '/url2',
              placeNames: ['Vračar'],
              agencyAvatarUrlTemplate,
              agencyUrl: 'url',
              image: { search: { '380x0_fill_0_webp': 'cover-photo-url' } },
              imageCount: 11,
            },
          ],
        },
        {
          info: {
            hasNextPage: false,
          },
          result: [
            {
              uniqueID: '44352-BS',
              propId: 44352,
              statusId: 51,
              cityId: 1,
              location: '44.79498, 20.47002',
              street: 'Internacionalnih brigada',
              floor: 'SU',
              size: 37,
              structure: '1.5',
              municipality: 'Vračar',
              polygons: ['Vračar'],
              ptId: 1,
              price: 450,
              coverPhoto: 'cover.jpg',
              rentOrSale: 's',
              caseId: 56305,
              caseType: 'BS',
              underConstruction: false,
              filed: 2,
              furnished: 1,
              ceiling: 2,
              furnishingArray: [],
              bldgOptsArray: [],
              heatingArray: [4],
              parkingArray: [5],
              yearOfConstruction: 1,
              joineryArray: [2],
              petsArray: [],
              otherArray: [],
              availableFrom: '0001-01-01T00:00:00Z',
              firstPublished: '2021-06-28T17:20:08Z',
              pricePerSize: 2162.162,
            },
          ],
        },
      ];
      const savedApartmentLists = [
        [
          {
            price: 420,
            id: 'cetiriZida_60993e3e7906cd3a4c6832fd',
            apartmentId: '60993e3e7906cd3a4c6832fd',
            providerName: 'cetiriZida',
            address: 'Dalmatinska',
            coverPhotoUrl: 'cover-photo-url',
            floor: 1,
            furnished: 'furnished',
            heatingTypes: ['district'],
            municipality: 'Zvezdara',
            place: 'Zvezdara opština',
            postedAt: new Date('2021-05-10T16:07:58+02:00'),
            rentOrSale: 'rent',
            size: 69,
            structure: 3,
            url: 'https://4zida.rs/url',
          },
        ],
        [
          {
            price: 450,
            id: 'cityExpert_23-BR',
            apartmentId: '23-BR',
            providerName: 'cityExpert',
            address: 'Cara Nikolaja Ii',
            availableFrom: '2021-08-09T11:04:13Z',
            coverPhotoUrl:
              'https://img.cityexpert.rs/sites/default/files/styles/1920x/public/image/url.jpg',
            advertiserName: 'City Expert',
            floor: 'high ground floor',
            furnished: 'furnished',
            heatingTypes: ['district'],
            location: { latitude: 45.79825, longitude: 21.48652 },
            municipality: 'Vračar',
            place: 'Vračar',
            rentOrSale: 'rent',
            size: 33,
            structure: 1.5,
            url:
              'https://cityexpert.rs/izdavanje/stan/23/jednoiposoban-cara-nikolaja-ii-vračar',
          },
        ],
        [
          {
            price: 500,
            id: 'cetiriZida_60f99390d9982b10',
            address: 'Kursulina',
            apartmentId: '60f99390d9982b10',
            providerName: 'cetiriZida',
            coverPhotoUrl: 'cover-photo-url',
            floor: 3,
            furnished: 'furnished',
            heatingTypes: ['district'],
            municipality: 'Vračar',
            place: 'Vračar',
            postedAt: new Date('2020-04-22T17:49:36+02:00'),
            rentOrSale: 'rent',
            size: 62,
            structure: 3,
            url: 'https://4zida.rs/url2',
          },
        ],
        [
          {
            price: 450,
            id: 'cityExpert_44352-BS',
            apartmentId: '44352-BS',
            providerName: 'cityExpert',
            address: 'Internacionalnih Brigada',
            availableFrom: '0001-01-01T00:00:00Z',
            coverPhotoUrl:
              'https://img.cityexpert.rs/sites/default/files/styles/1920x/public/image/cover.jpg',
            advertiserName: 'City Expert',
            floor: 'basement',
            furnished: 'furnished',
            heatingTypes: ['electricity'],
            location: { latitude: 44.79498, longitude: 20.47002 },
            municipality: 'Vračar',
            place: 'Vračar',
            rentOrSale: 'sale',
            size: 37,
            structure: 1.5,
            url:
              'https://cityexpert.rs/prodaja/stan/44352/jednoiposoban-internacionalnih-brigada-vračar',
          },
        ],
      ];
      jest.spyOn(baseProvider, 'getProviderRequests').mockReturnValue([
        // @ts-ignore
        { request: {}, provider: cetiriZidaProvider },
        // @ts-ignore
        { request: {}, provider: cityExpertProvider },
      ]);

      jest
        .spyOn(baseProvider, 'getProviderResults')
        .mockResolvedValueOnce(firstProviderResults)
        .mockResolvedValueOnce(secondProviderResults);

      jest
        .spyOn(cityExpertProvider, 'createRequestForApartment')
        .mockReturnValue({
          request: {},
          provider: CityExpertProvider,
        });

      jest
        .spyOn(cetiriZidaProvider, 'createRequestForApartment')
        .mockReturnValue({
          request: {},
          provider: CetiriZidaProvider,
        });

      await apartmentService.saveApartmentListFromProviders({
        furnished: ['furnished'],
        municipalities: ['Vračar', 'Zvezdara'],
        minPrice: 400,
        maxPrice: 500,
        structures: [1.5, 3.0],
        rentOrSale: RentOrSale.rent,
        pageNumber: 1,
      });

      savedApartmentLists.forEach((savedApartmentList, index) => {
        expect(apartmentRepository.saveApartmentList).toHaveBeenNthCalledWith(
          index + 1,
          savedApartmentList,
        );
      });
    });

    it('should skip saving already saved apartments', async () => {
      const providerResults = [
        {
          total: 2,
          ads: [
            {
              m2: 69,
              floor: 1,
              totalFloors: 3,
              furnished: 'yes',
              heatingType: 'district',
              id: '60993e3e7906cd3a4c6832fd',
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
            },
            {
              m2: 62,
              floor: 3,
              totalFloors: 5,
              furnished: 'yes',
              heatingType: 'district',
              id: '60f99390d9982b10',
              for: 'rent',
              price: 500,
              address: 'Kursulina',
              deposit: 1,
              paymentTerm: 'month',
              allowedVirtualSightseeing: false,
              featuredExpiresAt: '2021-08-24T09:38:53+02:00',
              featuredCounter: 3,
              authorId: 149,
              createdAt: '2020-04-22T17:49:36+02:00',
              roomCount: 3,
              description100: 'description',
              type: 'apartment',
              structureName: 'Dvosoban stan',
              structureAbbreviation: '2.0 stan',
              title: 'Hram Svetog Save',
              urlPath: '/url2',
              placeNames: ['Vračar'],
              agencyAvatarUrlTemplate,
              agencyUrl: 'url',
              image: { search: { '380x0_fill_0_webp': 'cover-photo-url' } },
              imageCount: 11,
            },
          ],
        },
        {
          info: {
            hasNextPage: false,
          },
          result: [],
        },
      ];
      const alreadySavedApartment = {
        price: 420,
        id: 'cetiriZida_60993e3e7906cd3a4c6832fd',
        apartmentId: '60993e3e7906cd3a4c6832fd',
        providerName: 'cetiriZida',
        address: 'Dalmatinska',
        coverPhotoUrl: 'cover-photo-url',
        floor: 1,
        furnished: 'furnished',
        heatingTypes: ['district'],
        municipality: 'Zvezdara',
        place: 'Zvezdara opština',
        postedAt: new Date('2021-05-10T16:07:58+02:00'),
        rentOrSale: 'rent',
        size: 69,
        structure: 3,
        url: 'https://4zida.rs/url',
      };

      const savedApartmentList = [
        {
          price: 500,
          id: 'cetiriZida_60f99390d9982b10',
          address: 'Kursulina',
          apartmentId: '60f99390d9982b10',
          providerName: 'cetiriZida',
          coverPhotoUrl: 'cover-photo-url',
          floor: 3,
          furnished: 'furnished',
          heatingTypes: ['district'],
          municipality: 'Vračar',
          place: 'Vračar',
          postedAt: new Date('2020-04-22T17:49:36+02:00'),
          rentOrSale: 'rent',
          size: 62,
          structure: 3,
          url: 'https://4zida.rs/url2',
        },
      ];
      jest.spyOn(baseProvider, 'getProviderRequests').mockReturnValue([
        // @ts-ignore
        { request: {}, provider: cetiriZidaProvider },
        // @ts-ignore
        { request: {}, provider: cityExpertProvider },
      ]);

      jest
        .spyOn(baseProvider, 'getProviderResults')
        .mockResolvedValue(providerResults);

      jest
        .spyOn(cetiriZidaProvider, 'createRequestForApartment')
        .mockReturnValue({
          request: {},
          provider: CetiriZidaProvider,
        });
      jest
        .spyOn(apartmentRepository, 'findOne')
        .mockResolvedValueOnce(alreadySavedApartment);

      await apartmentService.saveApartmentListFromProviders({
        furnished: ['furnished'],
        municipalities: ['Vračar', 'Zvezdara'],
        minPrice: 400,
        maxPrice: 500,
        structures: [1.5, 3.0],
        rentOrSale: RentOrSale.rent,
        pageNumber: 1,
      });

      expect(apartmentRepository.saveApartmentList).toHaveBeenCalledWith(
        savedApartmentList,
      );
    });

    it('should handle failed requests from providers', async () => {
      const providerResults = [
        {
          total: 1,
          ads: [
            {
              m2: 69,
              floor: 1,
              totalFloors: 3,
              furnished: 'yes',
              heatingType: 'district',
              id: '60993e3e7906cd3a4c6832fd',
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
              agencyAvatarUrlTemplate,
              agencyUrl: 'url',
              image: { search: { '380x0_fill_0_webp': 'cover-photo-url' } },
              imageCount: 15,
            },
          ],
        },
        {},
      ];
      const savedApartmentList = [
        {
          price: 420,
          id: 'cetiriZida_60993e3e7906cd3a4c6832fd',
          apartmentId: '60993e3e7906cd3a4c6832fd',
          providerName: 'cetiriZida',
          address: 'Dalmatinska',
          coverPhotoUrl: 'cover-photo-url',
          floor: 1,
          furnished: 'furnished',
          heatingTypes: ['district'],
          municipality: 'Zvezdara',
          place: 'Zvezdara opština',
          postedAt: new Date('2021-05-10T16:07:58+02:00'),
          rentOrSale: 'rent',
          size: 69,
          structure: 3,
          url: 'https://4zida.rs/url',
        },
      ];
      jest.spyOn(baseProvider, 'getProviderRequests').mockReturnValue([
        // @ts-ignore
        { request: {}, provider: cetiriZidaProvider },
        // @ts-ignore
        { request: {}, provider: cityExpertProvider },
      ]);

      jest
        .spyOn(baseProvider, 'getProviderResults')
        .mockResolvedValueOnce(providerResults);

      await apartmentService.saveApartmentListFromProviders({
        furnished: ['furnished'],
        municipalities: ['Vračar', 'Zvezdara'],
        minPrice: 400,
        maxPrice: 500,
        structures: [1.5, 3.0],
        rentOrSale: RentOrSale.rent,
        pageNumber: 1,
      });

      expect(apartmentRepository.saveApartmentList).toHaveBeenCalledWith(
        savedApartmentList,
      );
    });
  });
});
