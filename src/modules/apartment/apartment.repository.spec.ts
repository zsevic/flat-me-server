import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultPaginationParams,
  DEFAULT_LIMIT_PER_PAGE,
} from 'modules/pagination/pagination.constants';
import { getSkip } from 'modules/pagination/pagination.utils';
import { Between, In, MoreThan, Not, Repository } from 'typeorm';
import { Apartment } from './apartment.interface';
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
          postedAt: new Date('2021-06-23T13:38:19+02:00'),
          rentOrSale: 'rent',
          size: 41,
          structure: 3,
          url: 'url',
          createdAt: '2021-08-14T18:12:32.133Z',
          updatedAt: '2021-08-14T18:12:32.133Z',
        },
      ];
      const query = {
        furnished: In(filter.furnished),
        municipality: In(filter.municipalities),
        price: Between(filter.minPrice, filter.maxPrice),
        rentOrSale: filter.rentOrSale,
        structure: In(filter.structures),
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
          postedAt: new Date('2021-06-23T13:38:19+02:00'),
          rentOrSale: 'rent',
          size: 41,
          structure: 3,
          url: 'url',
          createdAt: '2021-08-14T18:12:32.133Z',
          updatedAt: '2021-08-14T18:12:32.133Z',
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

  describe('saveApartmentList', () => {
    it('should throw an error when apartment is already saved', async () => {
      const apartments = [
        {
          id: 'id',
        },
      ];
      jest
        .spyOn(Repository.prototype, 'findOne')
        .mockResolvedValue(apartments[0]);
      const saveSpy = jest.spyOn(Repository.prototype, 'save');

      await expect(
        apartmentRepository.saveApartmentList(apartments as Apartment[]),
      ).rejects.toThrowError();
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should save apartments', async () => {
      const apartments = [
        {
          id: 'id',
        },
      ];
      jest.spyOn(Repository.prototype, 'findOne').mockResolvedValue(null);
      const saveSpy = jest
        .spyOn(Repository.prototype, 'save')
        .mockResolvedValue(null);

      await apartmentRepository.saveApartmentList(apartments as Apartment[]);

      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
