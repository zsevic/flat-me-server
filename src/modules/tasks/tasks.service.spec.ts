import { Test, TestingModule } from '@nestjs/testing';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { filters } from 'modules/filter/filter.constants';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import {
  defaultPaginationParams,
  emptyPaginatedResponse,
  DEFAULT_LIMIT_PER_PAGE,
} from 'modules/pagination/pagination.constants';
import { SubscriptionService } from 'modules/subscription/subscription.service';
import { FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS } from 'modules/token/token.constants';
import { TokenType } from 'modules/token/token.enums';
import { TokenService } from 'modules/token/token.service';
import { Subscription } from 'modules/user/subscription.enum';
import { UserService } from 'modules/user/user.service';
import { TasksService } from './tasks.service';

const apartmentService = {
  deleteApartment: jest.fn(),
  getApartmentListFromDatabaseByFilter: jest.fn(),
  getApartmentsIds: jest.fn(),
  handleDeletingInactiveApartment: jest.fn(),
  isApartmentInactive: jest.fn(),
  saveApartmentListFromProviders: jest.fn(),
};

const filterService = {
  createTokenAndDeactivationUrl: jest.fn(),
  getFilterListBySubscriptionType: jest.fn(),
  getInitialFilter: filters => ({ ...filters, pageNumber: 1 }),
};

const mailService = {
  sendMailWithNewApartments: jest.fn(),
};

const subscriptionService = {
  sendNotification: jest.fn(),
};

const tokenService = {
  deleteTokenByFilterId: jest.fn(),
};

const userService = {
  getUserEmail: jest.fn(),
  insertReceivedApartments: jest.fn(),
};

jest.mock('typeorm-transactional-cls-hooked', () => ({
  Transactional: () => () => ({}),
}));

describe('TasksService', () => {
  let tasksService: TasksService;

  beforeAll(() => {
    process.env.NODE_APP_INSTANCE = '0';
  });

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
          provide: SubscriptionService,
          useValue: subscriptionService,
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

  describe('handleSendingNewApartments', () => {
    it('should not send any new apartments to the users when there are no saved filters', async () => {
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionType')
        .mockResolvedValue(emptyPaginatedResponse);

      await tasksService.handleSendingNewApartments(Subscription.BETA);

      expect(
        filterService.getFilterListBySubscriptionType,
      ).toHaveBeenCalledWith(Subscription.BETA, defaultPaginationParams);
      expect(
        apartmentService.getApartmentListFromDatabaseByFilter,
      ).not.toHaveBeenCalled();
    });

    it('should not send any apartments to the users when there are no new apartments by found filters', async () => {
      const foundFilter = {
        id: 'eea524df-b407-4994-8d3e-348a964318f7',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        userId: 'ee3af62e-3bca-49ec-984b-c9a3e16f36e3',
        createdAt: '2021-08-18T00:52:18.296Z',
      };
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionType')
        .mockResolvedValue({ data: [foundFilter], total: 1 });
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({ data: [] });
      jest
        .spyOn(userService, 'getUserEmail')
        .mockResolvedValue('test@example.com');

      await tasksService.handleSendingNewApartments();

      expect(
        filterService.getFilterListBySubscriptionType,
      ).toHaveBeenCalledWith(Subscription.FREE, defaultPaginationParams);
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
        foundFilter.id,
      );
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
    });

    it('should send new apartments by found filters', async () => {
      const foundFilter = {
        id: '5b87d75f-5849-4a3d-a3f5-6462a9147f41',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        userId: 'ad7bf1ac-df4b-4556-bb67-122bd82d3214',
        createdAt: '2021-08-18T00:52:18.296Z',
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
        {
          heatingTypes: ['district'],
          id: 'cetiriZida_id2',
          price: 320,
          apartmentId: 'id',
          providerName: 'cetiriZida',
          address: 'street',
          coverPhotoUrl: 'url',
          floor: 'ground floor',
          furnished: 'furnished',
          municipality: 'Savski venac',
          place: 'Sarajevska',
          postedAt: new Date('2021-06-23T13:38:19+02:00'),
          rentOrSale: 'rent',
          size: 41,
          structure: 1.5,
          url: 'url',
          createdAt: '2021-08-14T18:12:32.133Z',
          updatedAt: '2021-08-14T18:12:32.133Z',
        },
      ];
      const email = 'test@example.com';
      const filterDeactivationUrl = 'url';
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionType')
        .mockResolvedValue({ data: [foundFilter], total: 1 });
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({
          data: apartmentList,
        });
      jest.spyOn(userService, 'getUserEmail').mockResolvedValue(email);
      jest
        .spyOn(filterService, 'createTokenAndDeactivationUrl')
        .mockResolvedValue(filterDeactivationUrl);

      await tasksService.handleSendingNewApartments();

      expect(
        filterService.getFilterListBySubscriptionType,
      ).toHaveBeenCalledWith(Subscription.FREE, defaultPaginationParams);
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
        foundFilter.id,
      );
      expect(filterService.createTokenAndDeactivationUrl).toHaveBeenCalledWith(
        {
          filterId: foundFilter.id,
          userId: foundFilter.userId,
          type: TokenType.DEACTIVATION,
        },
        FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS,
      );
      expect(userService.getUserEmail).toHaveBeenCalledWith(foundFilter.userId);
      expect(mailService.sendMailWithNewApartments).toHaveBeenCalledWith(
        email,
        [apartmentList[1], apartmentList[0]],
        foundFilter,
        filterDeactivationUrl,
      );
      expect(
        userService.insertReceivedApartments,
      ).toHaveBeenCalledWith(foundFilter.userId, [
        apartmentList[1],
        apartmentList[0],
      ]);
    });

    it('should paginate over filters', async () => {
      const foundFilter = {
        id: '5b87d75f-5849-4a3d-a3f5-6462a9147f41',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: 'ad7bf1ac-df4b-4556-bb67-122bd82d3214',
        createdAt: '2021-08-18T00:52:18.296Z',
      };
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionType')
        .mockResolvedValue({ data: [foundFilter], total: 51 });
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({ data: [] });
      jest
        .spyOn(userService, 'getUserEmail')
        .mockResolvedValue('test@example.com');

      await tasksService.handleSendingNewApartments();

      [1, 2].forEach(pageNumber => {
        expect(
          filterService.getFilterListBySubscriptionType,
        ).toHaveBeenNthCalledWith(pageNumber, Subscription.FREE, {
          limitPerPage: defaultPaginationParams.limitPerPage,
          pageNumber,
        });
      });
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
        foundFilter.id,
      );
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
    });

    it('should continue handling filters when one of the filter handler fails', async () => {
      const foundFilters = [
        {
          id: '5b87d75f-5849-4a3d-a3f5-6462a9147f41',
          structures: [1, 2],
          municipalities: ['Savski venac', 'Zemun'],
          furnished: ['semi-furnished'],
          rentOrSale: 'rent',
          minPrice: 120,
          maxPrice: 370,
          userId: 'b2728317-869a-4183-a1e7-9d5ea616dff1',
          createdAt: '2021-08-18T00:37:22.039Z',
        },
        {
          id: 'eeb4f51d-25a2-4560-bb72-d1be3e13d585',
          structures: [1, 2, 0.5, 1.5],
          municipalities: ['Savski venac', 'Zemun'],
          furnished: ['semi-furnished'],
          rentOrSale: 'rent',
          minPrice: 120,
          maxPrice: 370,
          userId: '52f3372f-0e74-4ccb-bab7-3e397d46b0ef',
          createdAt: '2021-08-18T00:52:18.296Z',
        },
      ];
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionType')
        .mockResolvedValue({ data: foundFilters, total: foundFilters.length });
      jest
        .spyOn(tokenService, 'deleteTokenByFilterId')
        .mockRejectedValueOnce(new Error());
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({ data: [] });
      jest
        .spyOn(userService, 'getUserEmail')
        .mockResolvedValue('test@example.com');

      await tasksService.handleSendingNewApartments();

      expect(
        filterService.getFilterListBySubscriptionType,
      ).toHaveBeenCalledWith(Subscription.FREE, defaultPaginationParams);
      foundFilters.forEach(filter => {
        expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
          filter.id,
        );
      });
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledTimes(2);
      expect(
        apartmentService.getApartmentListFromDatabaseByFilter,
      ).not.toHaveBeenCalledWith(foundFilters[0], DEFAULT_LIMIT_PER_PAGE);
      expect(
        apartmentService.getApartmentListFromDatabaseByFilter,
      ).toHaveBeenCalledWith(foundFilters[1], DEFAULT_LIMIT_PER_PAGE);
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
    });

    it('should handle when push notification is not sent', async () => {
      const foundFilter = {
        id: '5b87d75f-5849-4a3d-a3f5-6462a9147f41',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: 'ad7bf1ac-df4b-4556-bb67-122bd82d3214',
        createdAt: '2021-08-18T00:52:18.296Z',
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
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionType')
        .mockResolvedValue({ data: [foundFilter], total: 1 });
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({ data: apartmentList });
      jest.spyOn(userService, 'getUserEmail').mockResolvedValue(null);
      jest
        .spyOn(subscriptionService, 'sendNotification')
        .mockResolvedValue(false);

      await tasksService.handleSendingNewApartments();

      expect(
        filterService.getFilterListBySubscriptionType,
      ).toHaveBeenNthCalledWith(1, Subscription.FREE, {
        limitPerPage: defaultPaginationParams.limitPerPage,
        pageNumber: 1,
      });
      expect(tokenService.deleteTokenByFilterId).not.toHaveBeenCalled();
      expect(
        filterService.createTokenAndDeactivationUrl,
      ).not.toHaveBeenCalled();
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
      expect(subscriptionService.sendNotification).toHaveBeenCalledWith(
        foundFilter,
        1,
      );
      expect(userService.insertReceivedApartments).not.toBeCalled();
    });

    it.only('should send push notifications for found filters', async () => {
      const foundFilter = {
        id: '5b87d75f-5849-4a3d-a3f5-6462a9147f41',
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        userId: 'ad7bf1ac-df4b-4556-bb67-122bd82d3214',
        createdAt: '2021-08-18T00:52:18.296Z',
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
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionType')
        .mockResolvedValue({ data: [foundFilter], total: 1 });
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabaseByFilter')
        .mockResolvedValue({ data: apartmentList });
      jest.spyOn(userService, 'getUserEmail').mockResolvedValue(null);
      jest
        .spyOn(subscriptionService, 'sendNotification')
        .mockResolvedValue(true);

      await tasksService.handleSendingNewApartments();

      expect(
        filterService.getFilterListBySubscriptionType,
      ).toHaveBeenNthCalledWith(1, Subscription.FREE, {
        limitPerPage: defaultPaginationParams.limitPerPage,
        pageNumber: 1,
      });
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
        foundFilter.id,
      );
      expect(tokenService.deleteTokenByFilterId).not.toHaveBeenCalled();
      expect(
        filterService.createTokenAndDeactivationUrl,
      ).not.toHaveBeenCalled();
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
      expect(subscriptionService.sendNotification).toHaveBeenCalledWith(
        foundFilter,
        1,
      );
      expect(userService.insertReceivedApartments).toHaveBeenCalledWith(
        foundFilter.userId,
        apartmentList,
      );
    });
  });
});
