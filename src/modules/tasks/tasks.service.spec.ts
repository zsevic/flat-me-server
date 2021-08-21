import { Test, TestingModule } from '@nestjs/testing';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { filters } from 'modules/filter/filter.constants';
import { FilterRepository } from 'modules/filter/filter.repository';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
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
          provide: FilterRepository,
          useValue: {},
        },
        {
          provide: MailService,
          useValue: {},
        },
        {
          provide: TokenService,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
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
        apartmentService.getApartmentListFromDatabase,
      ).not.toHaveBeenCalled();
    });
  });
});
