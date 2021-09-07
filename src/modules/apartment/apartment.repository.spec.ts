import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultPaginationParams,
  DEFAULT_LIMIT_PER_PAGE,
} from 'modules/pagination/pagination.constants';
import { getSkip } from 'modules/pagination/pagination.utils';
import { Repository } from 'typeorm';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';

describe('ApartmentRepository', () => {
  let apartmentRepository: ApartmentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApartmentRepository],
    }).compile();

    apartmentRepository = module.get<ApartmentRepository>(ApartmentRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getApartmentsIds', () => {
    it('should return list of found apartments ids', async () => {
      const apartmentList = [
        {
          id: 'id1',
        },
        {
          id: 'id2',
        },
      ];
      const apartmentsIds = ['id1', 'id2'];
      const findAndCountSpy = jest
        .spyOn(Repository.prototype, 'findAndCount')
        .mockResolvedValue([apartmentList, apartmentList.length]);

      const response = await apartmentRepository.getApartmentsIds(
        defaultPaginationParams,
      );

      expect(response).toEqual({
        data: apartmentsIds,
        total: apartmentsIds.length,
      });
      expect(findAndCountSpy).toHaveBeenCalledWith({
        select: ['id'],
        skip: getSkip(defaultPaginationParams),
        take: defaultPaginationParams.limitPerPage,
      });
    });
  });

  describe('getApartmentList', () => {
    it('should return apartment list', async () => {
      const filter = {
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
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
          postedAt: '2021-06-23T13:38:19+02:00',
          rentOrSale: 'rent',
          size: 41,
          structure: 3,
          url: 'url',
          __v: 0,
          createdAt: '2021-08-14T18:12:32.133Z',
          updatedAt: '2021-08-14T18:12:32.133Z',
        },
      ];
      const query = {
        furnished: {
          $in: filter.furnished,
        },
        municipality: {
          $in: filter.municipalities,
        },
        price: {
          $gte: filter.minPrice,
          $lte: filter.maxPrice,
        },
        rentOrSale: filter.rentOrSale,
        structure: {
          $in: filter.structures,
        },
      };
      const findAndCountSpy = jest
        .spyOn(Repository.prototype, 'findAndCount')
        .mockResolvedValue([apartmentList, 1]);

      const result = await apartmentRepository.getApartmentList(
        filter as ApartmentListParamsDto,
      );

      expect(result).toEqual({ total: 1, data: apartmentList });
      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: query,
        skip: getSkip(defaultPaginationParams),
        take: DEFAULT_LIMIT_PER_PAGE,
      });
    });

    it('should return new apartments', async () => {
      const filter = {
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
      };
      const skippedApartments = ['id2'];
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
          postedAt: '2021-06-23T13:38:19+02:00',
          rentOrSale: 'rent',
          size: 41,
          structure: 3,
          url: 'url',
          __v: 0,
          createdAt: '2021-08-14T18:12:32.133Z',
          updatedAt: '2021-08-14T18:12:32.133Z',
        },
      ];
      const dateFilter = new Date(2020, 8, 10);
      const query = {
        id: {
          $nin: skippedApartments,
        },
        createdAt: {
          $gte: dateFilter,
        },
        furnished: {
          $in: filter.furnished,
        },
        municipality: {
          $in: filter.municipalities,
        },
        price: {
          $gte: filter.minPrice,
          $lte: filter.maxPrice,
        },
        rentOrSale: filter.rentOrSale,
        structure: {
          $in: filter.structures,
        },
      };
      const findAndCountSpy = jest
        .spyOn(Repository.prototype, 'findAndCount')
        .mockResolvedValue([apartmentList, 1]);

      const result = await apartmentRepository.getApartmentList(
        filter as ApartmentListParamsDto,
        skippedApartments,
        dateFilter,
      );

      expect(result).toEqual({ total: 1, data: apartmentList });
      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: query,
        skip: getSkip(defaultPaginationParams),
        take: DEFAULT_LIMIT_PER_PAGE,
      });
    });
  });
});
