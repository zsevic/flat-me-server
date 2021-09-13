import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { defaultPaginationParams } from 'modules/pagination/pagination.constants';
import { Subscription } from 'modules/user/subscription.enum';
import { FilterEntity } from './filter.entity';
import { FilterRepository } from './filter.repository';

describe('FilterRepository', () => {
  let filterRepository: FilterRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilterRepository],
    }).compile();

    filterRepository = module.get<FilterRepository>(FilterRepository);
  });

  describe('findUnverifiedFilter', () => {
    it('should throw an error when filter is not found', async () => {
      const filterId = 'id1';
      const findOneSpy = jest
        .spyOn(filterRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(
        filterRepository.findUnverifiedFilter(filterId),
      ).rejects.toThrowError(BadRequestException);
      expect(findOneSpy).toHaveBeenCalledWith({
        id: filterId,
        isVerified: false,
      });
    });

    it('should return unverified filter', async () => {
      const filterId = 'id1';
      const filter = {
        id: filterId,
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        userId: '611c59c26962b452247b9431',
        createdAt: new Date('2021-08-18T00:52:18.296Z'),
        isActive: false,
        isVerified: false,
      };

      const findOneSpy = jest
        .spyOn(filterRepository, 'findOne')
        .mockResolvedValue(filter as FilterEntity);

      const unverifiedFilter = await filterRepository.findUnverifiedFilter(
        filterId,
      );

      expect(unverifiedFilter).toEqual(filter);
      expect(findOneSpy).toHaveBeenCalledWith({
        id: filterId,
        isVerified: false,
      });
    });
  });

  describe('getFilterListBySubscriptionName', () => {
    it('should return filter list by subscription name', async () => {
      const data = [];
      const total = 0;
      const filters = { data, total };
      jest
        .spyOn(Repository.prototype, 'createQueryBuilder')
        .mockReturnValue(SelectQueryBuilder.prototype);
      jest.spyOn(SelectQueryBuilder.prototype, 'leftJoin').mockReturnThis();
      jest
        .spyOn(SelectQueryBuilder.prototype, 'leftJoinAndSelect')
        .mockReturnThis();
      jest.spyOn(SelectQueryBuilder.prototype, 'where').mockReturnThis();
      jest.spyOn(SelectQueryBuilder.prototype, 'andWhere').mockReturnThis();
      jest.spyOn(SelectQueryBuilder.prototype, 'select').mockReturnThis();
      jest.spyOn(SelectQueryBuilder.prototype, 'skip').mockReturnThis();
      jest.spyOn(SelectQueryBuilder.prototype, 'take').mockReturnThis();
      jest
        .spyOn(SelectQueryBuilder.prototype, 'getManyAndCount')
        .mockResolvedValue([data, total]);

      const result = await filterRepository.getFilterListBySubscriptionName(
        Subscription.FREE,
        defaultPaginationParams,
      );

      expect(result).toEqual(filters);
    });
  });
});
