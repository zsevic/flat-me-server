import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { FilterRepository } from './filter.repository';

const filterModel = {
  findOne: jest.fn(),
};

describe('FilterRepository', () => {
  let filterRepository: FilterRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilterRepository,
        {
          provide: getModelToken('Filter'),
          useValue: filterModel,
        },
      ],
    }).compile();

    filterRepository = module.get<FilterRepository>(FilterRepository);
  });

  describe('findUnverifiedFilter', () => {
    it('should throw an error when filter is not found', async () => {
      const filterId = 'id1';
      jest.spyOn(filterModel, 'findOne').mockResolvedValue(null);

      await expect(
        filterRepository.findUnverifiedFilter(filterId),
      ).rejects.toThrowError(BadRequestException);
      expect(filterModel.findOne).toHaveBeenCalledWith({
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

      jest.spyOn(filterModel, 'findOne').mockResolvedValue(filter);

      const unverifiedFilter = await filterRepository.findUnverifiedFilter(
        filterId,
      );

      expect(unverifiedFilter).toEqual(filter);
      expect(filterModel.findOne).toHaveBeenCalledWith({
        _id: filterId,
        isVerified: false,
      });
    });
  });
});
