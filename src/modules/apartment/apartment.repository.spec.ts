import { Test, TestingModule } from '@nestjs/testing';
import { STRUCTURES } from 'modules/filter/filter.constants';
import {
  defaultPaginationParams,
  DEFAULT_LIMIT_PER_PAGE,
} from 'modules/pagination/pagination.constants';
import { getSkip } from 'modules/pagination/pagination.utils';
import { Between, In, MoreThan, Not } from 'typeorm';
import { ApartmentEntity } from './apartment.entity';
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
        .spyOn(apartmentRepository, 'findAndCount')
        .mockResolvedValue([
          apartmentList as ApartmentEntity[],
          apartmentList.length,
        ]);

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
    it('should return apartment list for rent', async () => {
      const filter = {
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [],
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
          postedAt: new Date('2021-06-23T13:38:19+02:00'),
          rentOrSale: 'rent',
          size: 41,
          structure: 3,
          url: 'url',
          createdAt: new Date('2021-08-14T18:12:32.133Z'),
          updatedAt: new Date('2021-08-14T18:12:32.133Z'),
        },
      ];
      const query = {
        furnished: In(filter.furnished),
        municipality: In(filter.municipalities),
        price: Between(filter.minPrice, filter.maxPrice),
        rentOrSale: filter.rentOrSale,
        structure: In(STRUCTURES),
      };
      const findAndCountSpy = jest
        .spyOn(apartmentRepository, 'findAndCount')
        .mockResolvedValue([apartmentList as ApartmentEntity[], 1]);

      const result = await apartmentRepository.getApartmentList(
        filter as ApartmentListParamsDto,
      );

      expect(result).toEqual({ total: 1, data: apartmentList });
      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: query,
        skip: getSkip(defaultPaginationParams),
        take: DEFAULT_LIMIT_PER_PAGE,
        order: {
          postedAt: 'DESC',
          createdAt: 'DESC',
        },
      });
    });

    it('should return apartment list for sale', async () => {
      const filter = {
        rentOrSale: 'sale',
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
          municipality: 'Savski venac',
          place: 'Sarajevska',
          postedAt: new Date('2021-06-23T13:38:19+02:00'),
          rentOrSale: 'sale',
          size: 41,
          structure: 3,
          url: 'url',
          createdAt: new Date('2021-08-14T18:12:32.133Z'),
          updatedAt: new Date('2021-08-14T18:12:32.133Z'),
        },
      ];
      const query = {
        municipality: In(filter.municipalities),
        price: Between(filter.minPrice, filter.maxPrice),
        rentOrSale: filter.rentOrSale,
        structure: In(filter.structures),
      };
      const findAndCountSpy = jest
        .spyOn(apartmentRepository, 'findAndCount')
        .mockResolvedValue([apartmentList as ApartmentEntity[], 1]);

      const result = await apartmentRepository.getApartmentList(
        filter as ApartmentListParamsDto,
      );

      expect(result).toEqual({ total: 1, data: apartmentList });
      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: query,
        skip: getSkip(defaultPaginationParams),
        take: DEFAULT_LIMIT_PER_PAGE,
        order: {
          postedAt: 'DESC',
          createdAt: 'DESC',
        },
      });
    });

    it('should return new apartments sorted by postedAt value', async () => {
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
          postedAt: new Date('2021-06-23T13:38:19+02:00'),
          rentOrSale: 'rent',
          size: 41,
          structure: 3,
          url: 'url',
          createdAt: new Date('2021-08-14T18:12:32.133Z'),
          updatedAt: new Date('2021-08-14T18:12:32.133Z'),
        },
      ];
      const dateFilter = new Date(2020, 8, 10);
      const query = {
        id: Not(In(skippedApartments)),
        createdAt: MoreThan(dateFilter),
        furnished: In(filter.furnished),
        municipality: In(filter.municipalities),
        price: Between(filter.minPrice, filter.maxPrice),
        rentOrSale: filter.rentOrSale,
        structure: In(filter.structures),
      };
      const findAndCountSpy = jest
        .spyOn(apartmentRepository, 'findAndCount')
        .mockResolvedValue([apartmentList as ApartmentEntity[], 1]);

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
        order: {
          postedAt: 'DESC',
          createdAt: 'DESC',
        },
      });
    });
  });
});
