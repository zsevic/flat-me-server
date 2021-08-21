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
  saveApartmentListFromProviders: jest.fn(),
};

describe('TasksService', () => {
  let tasksService: TasksService;
  let filterService: FilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: ApartmentService,
          useValue: apartmentService,
        },
        FilterService,
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
    filterService = module.get<FilterService>(FilterService);
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
});
