import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoRepository } from 'typeorm';
import { FilterRepository } from './filter.repository';

describe('FilterRepository', () => {
  let filterRepository: FilterRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilterRepository],
    }).compile();

    filterRepository = module.get<FilterRepository>(FilterRepository);
  });

  describe('findFilterById', () => {
    it('should throw an error when filter is not found', async () => {
      const filterId = 'filterid';
      const findOneSpy = jest
        .spyOn(MongoRepository.prototype, 'findOne')
        .mockResolvedValue(null);

      await expect(
        filterRepository.findFilterById(filterId),
      ).rejects.toThrowError(BadRequestException);

      expect(findOneSpy).toHaveBeenCalledWith({ _id: filterId });
    });

    it('should return found filter', async () => {
      const filterId = 'filterid';
      const filter = {
        _id: filterId,
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: new Date('2021-08-18T00:52:18.296Z'),
        isActive: false,
        isVerified: false,
      };

      const findOneSpy = jest
        .spyOn(MongoRepository.prototype, 'findOne')
        .mockResolvedValue(filter);

      const foundFilter = await filterRepository.findFilterById(filterId);

      expect(foundFilter).toEqual(filter);
      expect(findOneSpy).toHaveBeenCalledWith({ _id: filterId });
    });
  });

  describe('findUnverifiedFilter', () => {
    it('should throw an error when filter is not found', async () => {
      const filterId = 'id1';
      const findOneSpy = jest
        .spyOn(MongoRepository.prototype, 'findOne')
        .mockResolvedValue(null);

      await expect(
        filterRepository.findUnverifiedFilter(filterId),
      ).rejects.toThrowError(BadRequestException);
      expect(findOneSpy).toHaveBeenCalledWith({
        _id: filterId,
        isVerified: false,
      });
    });

    it('should return unverified filter', async () => {
      const filterId = 'id1';
      const filter = {
        _id: filterId,
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: new Date('2021-08-18T00:52:18.296Z'),
        isActive: false,
        isVerified: false,
      };

      const findOneSpy = jest
        .spyOn(MongoRepository.prototype, 'findOne')
        .mockResolvedValue(filter);

      const unverifiedFilter = await filterRepository.findUnverifiedFilter(
        filterId,
      );

      expect(unverifiedFilter).toEqual(filter);
      expect(findOneSpy).toHaveBeenCalledWith({
        _id: filterId,
        isVerified: false,
      });
    });
  });
});
