import { HttpService, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RentOrSale } from 'modules/filter/filter.enums';
import { UserService } from 'modules/user/user.service';
import {
  apartmentActivityBaseUrlForCetiriZida,
  apartmentActivityBaseUrlForCityExpert,
  apartmentStatusFinished,
  apartmentStatusNotAvailable,
} from './apartment.constants';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentService } from './apartment.service';
import { BaseProvider } from './providers';

const apartmentRepository = {
  deleteApartment: jest.fn(),
  saveApartmentList: jest.fn(),
};

const baseProvider = {
  getProviderRequest: jest.fn(),
  getProviderRequests: jest.fn(),
  getProviderResults: jest.fn(),
};

const httpService = {
  get: jest.fn(),
  toPromise: jest.fn(),
};

const userService = {
  getReceivedApartmentsIds: jest.fn(),
};

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
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    apartmentService = module.get<ApartmentService>(ApartmentService);
  });

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
            agencyAvatarUrlTemplate: 'url',
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
            agencyAvatarUrlTemplate: 'url',
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
          _id: 'cetiriZida_60993e3e7906cd3a4c6832fd',
          apartmentId: '60993e3e7906cd3a4c6832fd',
          providerName: 'cetiriZida',
          address: 'Dalmatinska',
          coverPhotoUrl: 'cover-photo-url',
          floor: 1,
          furnished: 'furnished',
          heatingTypes: ['district'],
          municipality: 'Zvezdara',
          place: 'Zvezdara opština',
          postedAt: '2021-05-10T16:07:58+02:00',
          rentOrSale: 'rent',
          size: 69,
          structure: 3,
          url: 'https://4zida.rs/url',
        },
      ],
      [
        {
          price: 450,
          _id: 'cityExpert_23-BR',
          apartmentId: 23,
          providerName: 'cityExpert',
          address: 'Cara Nikolaja Ii',
          availableFrom: '2021-08-09T11:04:13Z',
          coverPhotoUrl:
            'https://img.cityexpert.rs/sites/default/files/styles/1920x/public/image/url.jpg',
          floor: 'high ground floor',
          furnished: 'furnished',
          heatingTypes: ['district'],
          location: { latitude: '45.79825', longitude: '21.48652' },
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
          _id: 'cetiriZida_60f99390d9982b10',
          apartmentId: '60f99390d9982b10',
          providerName: 'cetiriZida',
          coverPhotoUrl: 'cover-photo-url',
          floor: 3,
          furnished: 'furnished',
          heatingTypes: ['district'],
          municipality: 'Vračar',
          place: 'Vračar',
          postedAt: '2020-04-22T17:49:36+02:00',
          rentOrSale: 'rent',
          size: 62,
          structure: 3,
          url: 'https://4zida.rs/url2',
        },
      ],
      [
        {
          price: 450,
          _id: 'cityExpert_44352-BS',
          apartmentId: 44352,
          providerName: 'cityExpert',
          address: 'Internacionalnih Brigada',
          availableFrom: '0001-01-01T00:00:00Z',
          coverPhotoUrl:
            'https://img.cityexpert.rs/sites/default/files/styles/1920x/public/image/cover.jpg',
          floor: 'basement',
          furnished: 'furnished',
          heatingTypes: ['electricity'],
          location: { latitude: '44.79498', longitude: '20.47002' },
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
    const cetiriZida = 'cetiriZida';
    const cityExpert = 'cityExpert';
    jest.spyOn(baseProvider, 'getProviderRequests').mockReturnValue([
      // @ts-ignore
      { request: {}, providerName: cetiriZida },
      // @ts-ignore
      { request: {}, providerName: cityExpert },
    ]);
    jest.spyOn(baseProvider, 'getProviderRequest').mockReturnValueOnce(
      // @ts-ignore
      { request: {}, providerName: cetiriZida },
    );
    jest.spyOn(baseProvider, 'getProviderRequest').mockReturnValueOnce(
      // @ts-ignore
      { request: {}, providerName: cityExpert },
    );

    jest
      .spyOn(baseProvider, 'getProviderResults')
      .mockResolvedValueOnce(firstProviderResults);
    jest
      .spyOn(baseProvider, 'getProviderResults')
      .mockResolvedValueOnce(secondProviderResults);

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
            agencyAvatarUrlTemplate: 'url',
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
        _id: 'cetiriZida_60993e3e7906cd3a4c6832fd',
        apartmentId: '60993e3e7906cd3a4c6832fd',
        providerName: 'cetiriZida',
        address: 'Dalmatinska',
        coverPhotoUrl: 'cover-photo-url',
        floor: 1,
        furnished: 'furnished',
        heatingTypes: ['district'],
        municipality: 'Zvezdara',
        place: 'Zvezdara opština',
        postedAt: '2021-05-10T16:07:58+02:00',
        rentOrSale: 'rent',
        size: 69,
        structure: 3,
        url: 'https://4zida.rs/url',
      },
    ];
    const cetiriZida = 'cetiriZida';
    const cityExpert = 'cityExpert';
    jest.spyOn(baseProvider, 'getProviderRequests').mockReturnValue([
      // @ts-ignore
      { request: {}, providerName: cetiriZida },
      // @ts-ignore
      { request: {}, providerName: cityExpert },
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

  describe('cetiriZida', () => {
    it('should skip deleting inactive apartment', async () => {
      const apartmentId = '1234';
      const id = `cetiriZida_${apartmentId}`;
      const url = `${apartmentActivityBaseUrlForCetiriZida}/${apartmentId}`;
      jest.spyOn(httpService, 'get').mockReturnThis();

      await apartmentService.handleDeletingInactiveApartmentFromCetiriZida(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
    });

    it('should delete inactive apartment', async () => {
      const apartmentId = '1234';
      const id = `cetiriZida_${apartmentId}`;
      const url = `${apartmentActivityBaseUrlForCetiriZida}/${apartmentId}`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest
        .spyOn(httpService, 'toPromise')
        .mockRejectedValue({ response: { status: HttpStatus.NOT_FOUND } });

      await apartmentService.handleDeletingInactiveApartmentFromCetiriZida(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(apartmentRepository.deleteApartment).toHaveBeenCalledWith(id);
    });
  });

  describe('cityExpert', () => {
    it('should skip deleting inactive apartment', async () => {
      const apartmentId = '1234';
      const id = `cityExpert_${apartmentId}-BR`;
      const url = `${apartmentActivityBaseUrlForCityExpert}/${apartmentId}/r`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest.spyOn(httpService, 'toPromise').mockResolvedValue({
        data: {
          status: 'ACTIVE',
        },
      });

      await apartmentService.handleDeletingInactiveApartmentFromCityExpert(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
    });

    it(`should delete an apartment when status is ${apartmentStatusNotAvailable}`, async () => {
      const apartmentId = '1234';
      const id = `cityExpert_${apartmentId}-BR`;
      const url = `${apartmentActivityBaseUrlForCityExpert}/${apartmentId}/r`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest.spyOn(httpService, 'toPromise').mockResolvedValue({
        data: {
          status: apartmentStatusNotAvailable,
        },
      });

      await apartmentService.handleDeletingInactiveApartmentFromCityExpert(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(apartmentRepository.deleteApartment).toHaveBeenCalledWith(id);
    });

    it(`should delete an apartment when status is ${apartmentStatusFinished}`, async () => {
      const apartmentId = '1234';
      const id = `cityExpert_${apartmentId}-BR`;
      const url = `${apartmentActivityBaseUrlForCityExpert}/${apartmentId}/r`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest.spyOn(httpService, 'toPromise').mockResolvedValue({
        data: {
          status: apartmentStatusFinished,
        },
      });

      await apartmentService.handleDeletingInactiveApartmentFromCityExpert(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(apartmentRepository.deleteApartment).toHaveBeenCalledWith(id);
    });

    it(`should delete an apartment when apartment is not found`, async () => {
      const apartmentId = '1234';
      const id = `cityExpert_${apartmentId}-BR`;
      const url = `${apartmentActivityBaseUrlForCityExpert}/${apartmentId}/r`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest
        .spyOn(httpService, 'toPromise')
        .mockRejectedValue({ response: { status: HttpStatus.NOT_FOUND } });

      await apartmentService.handleDeletingInactiveApartmentFromCityExpert(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(apartmentRepository.deleteApartment).toHaveBeenCalledWith(id);
    });
  });
});
