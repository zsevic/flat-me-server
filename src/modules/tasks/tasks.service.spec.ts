import { Test, TestingModule } from '@nestjs/testing';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { filters } from 'modules/filter/filter.constants';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
import { Subscription } from 'modules/user/subscription.enum';
import { UserService } from 'modules/user/user.service';
import { TasksService } from './tasks.service';

const apartmentService = {
  getApartmentListFromDatabase: jest.fn(),
  getApartmentsIds: jest.fn(),
  handleDeletingInactiveApartmentFromCetiriZida: jest.fn(),
  handleDeletingInactiveApartmentFromCityExpert: jest.fn(),
  saveApartmentListFromProviders: jest.fn(),
};

const filterService = {
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
  getReceivedApartmentsIds: jest.fn(),
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

  it('should handle scraping data from providers', async () => {
    await tasksService.handleScraping();

    filters.forEach((filter, index) => {
      expect(
        apartmentService.saveApartmentListFromProviders,
      ).toHaveBeenNthCalledWith(
        index + 1,
        filterService.getInitialFilter(filter),
      );
    });
  });

  it('should handle deleting inactive apartments', async () => {
    const cetiriZidaApartmentId = 'cetiriZida_23';
    const cityExpertApartmentId = 'cityExpert_12-BR';
    jest
      .spyOn(apartmentService, 'getApartmentsIds')
      .mockResolvedValue([cetiriZidaApartmentId, cityExpertApartmentId]);

    await tasksService.handleDeletingInactiveApartments();

    expect(
      apartmentService.handleDeletingInactiveApartmentFromCetiriZida,
    ).toHaveBeenCalledWith(cetiriZidaApartmentId);
    expect(
      apartmentService.handleDeletingInactiveApartmentFromCityExpert,
    ).toHaveBeenCalledWith(cityExpertApartmentId);
  });

  describe('handleSendingNewApartmentsForFreeSubscriptionUsers', () => {
    it('should not send any new apartments to the users when there are no saved filters', async () => {
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionName')
        .mockResolvedValue([]);

      await tasksService.handleSendingNewApartmentsForFreeSubscriptionUsers();

      expect(
        filterService.getFilterListBySubscriptionName,
      ).toHaveBeenCalledWith(Subscription.FREE);
      expect(
        apartmentService.getApartmentListFromDatabase,
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
      const receivedApartmentsIds = ['id1'];
      jest
        .spyOn(filterService, 'getFilterListBySubscriptionName')
        .mockResolvedValue([foundFilter]);
      jest
        .spyOn(userService, 'getReceivedApartmentsIds')
        .mockResolvedValue(receivedApartmentsIds);
      jest
        .spyOn(apartmentService, 'getApartmentListFromDatabase')
        .mockResolvedValue({ data: [] });

      await tasksService.handleSendingNewApartmentsForFreeSubscriptionUsers();

      expect(
        filterService.getFilterListBySubscriptionName,
      ).toHaveBeenCalledWith(Subscription.FREE);
      expect(tokenService.deleteTokenByFilterId).toHaveBeenCalledWith(
        foundFilter._id,
      );
      expect(userService.getReceivedApartmentsIds).toHaveBeenCalledWith(
        foundFilter.user,
      );
      expect(mailService.sendMailWithNewApartments).not.toHaveBeenCalled();
    });
  });
});
