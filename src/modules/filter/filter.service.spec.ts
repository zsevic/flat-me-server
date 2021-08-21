import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from 'modules/token/token.service';
import { FilterRepository } from './filter.repository';
import { FilterService } from './filter.service';

const filterRepository = {};
const tokenService = {
  createAndSaveToken: jest.fn(),
};

describe('FilterService', () => {
  let filterService: FilterService;
  const clientUrl = 'client-url';

  beforeAll(() => {
    process.env.CLIENT_URL = clientUrl;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilterService,
        {
          provide: FilterRepository,
          useValue: filterRepository,
        },
        {
          provide: TokenService,
          useValue: tokenService,
        },
      ],
    }).compile();

    filterService = module.get<FilterService>(FilterService);
  });

  it('should return deactivation url by given filter', async () => {
    const tokenValue = 'token';
    const filterId = 'id1';
    const expirationHours = 24;
    jest.spyOn(tokenService, 'createAndSaveToken').mockResolvedValue({
      value: tokenValue,
    });

    const deactivationUrl = await filterService.getDeactivationUrl(
      filterId,
      expirationHours,
    );

    expect(deactivationUrl).toEqual(
      `${clientUrl}/filters/deactivation/${tokenValue}`,
    );
    expect(tokenService.createAndSaveToken).toHaveBeenCalledWith(
      { filter: filterId },
      expirationHours,
    );
  });
});
