import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from 'modules/token/token.service';
import { RentOrSale } from './filter.enums';
import { FilterRepository } from './filter.repository';
import { FilterService } from './filter.service';

const filterRepository = {
  findUnverifiedFilter: jest.fn(),
  verifyAndActivateFilter: jest.fn(),
};

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

  describe('getDeactivationUrl', () => {
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

  describe('getInitialFilter', () => {
    it('should return initial filter', () => {
      const filter = {
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: RentOrSale.rent,
        minPrice: 120,
        maxPrice: 370,
      };
      const initialFilter = filterService.getInitialFilter(filter);

      expect(initialFilter).toEqual({ ...filter, pageNumber: 1 });
    });
  });

  describe('verifyAndActivateFilter', () => {
    it('should throw an error if unverified filter is not found', async () => {
      const filterId = 'id1';
      jest
        .spyOn(filterRepository, 'findUnverifiedFilter')
        .mockRejectedValue(new BadRequestException());

      await expect(
        filterService.verifyAndActivateFilter(filterId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should verify and activate found filter', async () => {
      const filterId = '611c59c26962b452247b9432';
      const foundFilter = {
        _id: filterId,
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: '2021-08-18T00:52:18.296Z',
        set: function(values) {
          Object.assign(this, values);
        },
        save: jest.fn(),
      };
      const updatedFilter = {
        ...foundFilter,
        isActive: true,
        isVerified: true,
      };
      jest
        .spyOn(filterRepository, 'findUnverifiedFilter')
        .mockResolvedValue(foundFilter);
      jest
        .spyOn(filterRepository, 'verifyAndActivateFilter')
        .mockImplementation(async () => {
          foundFilter.set({
            isActive: true,
            isVerified: true,
          });
          await foundFilter.save();
        });

      const filter = await filterService.verifyAndActivateFilter(filterId);

      expect(filter).toMatchObject(updatedFilter);
      expect(filterRepository.verifyAndActivateFilter).toHaveBeenCalledWith(
        foundFilter,
      );
    });
  });
});
