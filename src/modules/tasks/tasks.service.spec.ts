import { Test, TestingModule } from '@nestjs/testing';
import { RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION } from 'modules/apartment/apartment.constants';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { filters } from 'modules/filter/filter.constants';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS } from 'modules/token/token.constants';
import { TokenService } from 'modules/token/token.service';
import { Subscription } from 'modules/user/subscription.enum';
import { UserService } from 'modules/user/user.service';
import { defaultPaginationParams, emptyResponse } from './tasks.constants';
import { TasksService } from './tasks.service';

const apartmentService = {
  deleteApartment: jest.fn(),
  getApartmentListFromDatabaseByFilter: jest.fn(),
  getApartmentsIds: jest.fn(),
  handleDeletingInactiveApartmentFromCetiriZida: jest.fn(),
  handleDeletingInactiveApartmentFromCityExpert: jest.fn(),
  isApartmentInactive: jest.fn(),
  saveApartmentListFromProviders: jest.fn(),
};

const filterService = {
  getDeactivationUrl: jest.fn(),
  getFilterListBySubscriptionName: jest.fn(),
  getInitialFilter: filters => ({ ...filters, pageNumber: 1 }),
};

const mailService = {
  sendMailWithNewApartments: jest.fn(),
};

const tokenService = {
  deleteTokenByFilterId: jest.fn(),
};

const userService = {
  getUserEmail: jest.fn(),
  insertReceivedApartmentsIds: jest.fn(),
};

describe('TasksService', () => {
  let tasksService: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: ApartmentService,
          useValue: apartmentService,
        },
        {
          provide: FilterService,
          useValue: filterService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        {
          provide: TokenService,
          useValue: tokenService,
        },
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
  });

  describe('handleDeletingInactiveApartments', () => {
    it('should handle deleting inactive apartments', async () => {
      const cetiriZidaApartmentId = 'cetiriZida_23';
      const cityExpertApartmentId = 'cityExpert_12-BR';
      jest
        .spyOn(apartmentService, 'getApartmentsIds')
        .mockResolvedValue([cetiriZidaApartmentId, cityExpertApartmentId]);
      jest
        .spyOn(apartmentService, 'isApartmentInactive')
        .mockResolvedValueOnce(true);
      jest
        .spyOn(apartmentService, 'isApartmentInactive')
        .mockResolvedValueOnce(false);

      await tasksService.handleDeletingInactiveApartments();

      expect(apartmentService.isApartmentInactive).toHaveBeenCalledWith(
        cetiriZidaApartmentId,
      );
      expect(apartmentService.isApartmentInactive).toHaveBeenCalledWith(
        cityExpertApartmentId,
      );
      expect(apartmentService.deleteApartment).toHaveBeenCalledWith(
        cetiriZidaApartmentId,
      );
      expect(apartmentService.deleteApartment).not.toHaveBeenCalledWith(
        cityExpertApartmentId,
      );
    });
  });

  describe('handleSavingApartmentListFromProviders', () => {
    it('should handle saving apartment list from providers', async () => {
      await tasksService.handleSavingApartmentListFromProviders();

      filters.forEach((filter, index) => {
        expect(
          apartmentService.saveApartmentListFromProviders,
        ).toHaveBeenNthCalledWith(
          index + 1,
          filterService.getInitialFilter(filter),
        );
      });
    });
  });

  describe('handleSendingNewApartmentsForFreeSubscriptionUsers', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should not send any new apartments to the users when there are no saved filters', async () => {
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionName')
        .mockResolvedValue(emptyResponse);

      await tasksService.handleSendingNewApartmentsForFreeSubscriptionUsers();

      expect(
        filterService.getFilterListBySubscriptionName,
      ).toHaveBeenCalledWith(Subscription.FREE, defaultPaginationParams);
      expect(
        apartmentService.getApartmentListFromDatabaseByFilter,
      ).not.toHaveBeenCalled();
    });

    it('should not send any apartments to the users when there are no new apartments by found filters', async () => {
      const foundFilter = {
        _id: '611c59c26962b452247b9432',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: '2021-08-18T00:52:18.296Z',
      };
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionName')
        .mockResolvedValue({ data: [foundFilter], total: 1 });
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({ data: [] });

      await tasksService.handleSendingNewApartmentsForFreeSubscriptionUsers();

      expect(
        filterService.getFilterListBySubscriptionName,
      ).toHaveBeenCalledWith(Subscription.FREE, defaultPaginationParams);
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
        foundFilter._id,
      );
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
    });

    it('should send new apartments by found filters', async () => {
      const foundFilter = {
        _id: '611c59c26962b452247b9432',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: '2021-08-18T00:52:18.296Z',
      };
      const apartmentList = [
        {
          heatingTypes: ['central'],
          _id: 'cetiriZida_id1',
          price: 350,
          apartmentId: 'id',
          providerName: 'cetiriZida',
          address: 'street',
          coverPhotoUrl: 'url',
          floor: 'ground floor',
          furnished: 'semi-furnished',
          municipality: 'Savski venac',
          place: 'Sarajevska',
          postedAt: '2021-06-23T13:38:19+02:00',
          rentOrSale: 'rent',
          size: 41,
          structure: 3,
          url: 'url',
          __v: 0,
          createdAt: '2021-08-14T18:12:32.133Z',
          updatedAt: '2021-08-14T18:12:32.133Z',
        },
        {
          heatingTypes: ['district'],
          _id: 'cetiriZida_id2',
          price: 320,
          apartmentId: 'id',
          providerName: 'cetiriZida',
          address: 'street',
          coverPhotoUrl: 'url',
          floor: 'ground floor',
          furnished: 'furnished',
          municipality: 'Savski venac',
          place: 'Sarajevska',
          postedAt: '2021-06-23T13:38:19+02:00',
          rentOrSale: 'rent',
          size: 41,
          structure: 1.5,
          url: 'url',
          __v: 0,
          createdAt: '2021-08-14T18:12:32.133Z',
          updatedAt: '2021-08-14T18:12:32.133Z',
        },
      ];
      const email = 'test@example.com';
      const filterDeactivationUrl = 'url';
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionName')
        .mockResolvedValue({ data: [foundFilter], total: 1 });
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({
          data: apartmentList,
        });
      jest.spyOn(userService, 'getUserEmail').mockResolvedValue(email);
      jest
        .spyOn(filterService, 'getDeactivationUrl')
        .mockResolvedValue(filterDeactivationUrl);

      await tasksService.handleSendingNewApartmentsForFreeSubscriptionUsers();

      expect(
        filterService.getFilterListBySubscriptionName,
      ).toHaveBeenCalledWith(Subscription.FREE, defaultPaginationParams);
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
        foundFilter._id,
      );
      expect(filterService.getDeactivationUrl).toHaveBeenCalledWith(
        foundFilter._id,
        FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS,
      );
      expect(userService.getUserEmail).toHaveBeenCalledWith(foundFilter.user);
      expect(mailService.sendMailWithNewApartments).toHaveBeenCalledWith(
        email,
        [apartmentList[1], apartmentList[0]],
        foundFilter,
        filterDeactivationUrl,
      );
      expect(
        userService.insertReceivedApartmentsIds,
      ).toHaveBeenCalledWith(foundFilter.user, [
        apartmentList[1],
        apartmentList[0],
      ]);
    });

    it('should paginate over filters', async () => {
      const foundFilter = {
        _id: '611c59c26962b452247b9432',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: '2021-08-18T00:52:18.296Z',
      };
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionName')
        .mockResolvedValue({ data: [foundFilter], total: 51 });
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({ data: [] });

      await tasksService.handleSendingNewApartmentsForFreeSubscriptionUsers();

      [1, 2].forEach(pageNumber => {
        expect(
          filterService.getFilterListBySubscriptionName,
        ).toHaveBeenNthCalledWith(pageNumber, Subscription.FREE, {
          limitPerPage: defaultPaginationParams.limitPerPage,
          pageNumber,
        });
      });
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
        foundFilter._id,
      );
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
    });

    it('should continue handling filters when one of the filter handler fails', async () => {
      const foundFilters = [
        {
          _id: '611c5642c653f746ea0560a3',
          structures: [1, 2],
          municipalities: ['Savski venac', 'Zemun'],
          furnished: ['semi-furnished'],
          rentOrSale: 'rent',
          minPrice: 120,
          maxPrice: 370,
          user: '611c5641c653f746ea0560a2',
          createdAt: '2021-08-18T00:37:22.039Z',
        },
        {
          _id: '611c59c26962b452247b9432',
          structures: [1, 2, 0.5, 1.5],
          municipalities: ['Savski venac', 'Zemun'],
          furnished: ['semi-furnished'],
          rentOrSale: 'rent',
          minPrice: 120,
          maxPrice: 370,
          user: '611c59c26962b452247b9431',
          createdAt: '2021-08-18T00:52:18.296Z',
        },
      ];
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionName')
        .mockResolvedValue({ data: foundFilters, total: foundFilters.length });
      jest
        .spyOn(tokenService, 'deleteTokenByFilterId')
        .mockRejectedValueOnce(new Error());
      jest
        .spyOn(tokenService, 'deleteTokenByFilterId')
        .mockResolvedValue(undefined);
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({ data: [] });

      await tasksService.handleSendingNewApartmentsForFreeSubscriptionUsers();

      expect(
        filterService.getFilterListBySubscriptionName,
      ).toHaveBeenCalledWith(Subscription.FREE, defaultPaginationParams);
      foundFilters.forEach(filter => {
        expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
          filter._id,
        );
      });
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledTimes(2);
      expect(
        apartmentService.getApartmentListFromDatabaseByFilter,
      ).not.toHaveBeenCalledWith(
        foundFilters[0],
        RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION,
      );
      expect(
        apartmentService.getApartmentListFromDatabaseByFilter,
      ).toHaveBeenCalledWith(
        foundFilters[1],
        RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION,
      );
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
    });
  });
});
