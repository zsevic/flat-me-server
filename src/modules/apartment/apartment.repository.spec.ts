import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultPaginationParams } from 'modules/pagination/pagination.constants';
import { getSkip } from 'modules/pagination/pagination.utils';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';

const apartmentModel = {
  countDocuments: jest.fn(),
  exec: jest.fn(),
  find: jest.fn(),
  limit: jest.fn(),
  select: jest.fn(),
  skip: jest.fn(),
};

describe('ApartmentRepository', () => {
  let apartmentRepository: ApartmentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApartmentRepository,
        {
          provide: getModelToken('Apartment'),
          useValue: apartmentModel,
        },
      ],
    }).compile();

    apartmentRepository = module.get<ApartmentRepository>(ApartmentRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getApartmentsIds', () => {
    it.skip('should return list of found apartments ids', async () => {
      const apartmentList = [
        {
          _id: 'id1',
        },
        {
          _id: 'id2',
        },
      ];
      const apartmentsIds = ['id1', 'id2'];
      jest.spyOn(apartmentModel, 'find').mockReturnThis();
      jest.spyOn(apartmentModel, 'select').mockReturnThis();
      jest.spyOn(apartmentModel, 'limit').mockReturnThis();
      jest.spyOn(apartmentModel, 'skip').mockReturnThis();
      jest
        .spyOn(apartmentModel, 'exec')
        .mockResolvedValueOnce(apartmentList)
        .mockResolvedValueOnce(apartmentList.length);

      jest.spyOn(apartmentModel, 'countDocuments').mockReturnThis();

      const response = await apartmentRepository.getApartmentsIds(
        defaultPaginationParams,
      );

      expect(response).toEqual({
        data: apartmentsIds,
        total: apartmentsIds.length,
      });
      expect(apartmentModel.find).toHaveBeenCalled();
      expect(apartmentModel.select).toHaveBeenCalledWith('_id');
      expect(apartmentModel.limit).toHaveBeenCalledWith(
        defaultPaginationParams.limitPerPage,
      );
      expect(apartmentModel.skip).toHaveBeenCalledWith(
        getSkip(defaultPaginationParams),
      );
      expect(apartmentModel.exec).toHaveBeenCalledTimes(2);
    });
  });

  describe('getApartmentList', () => {
    it.skip('should return apartment list', async () => {
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
          _id: 'cetiriZida_id1',
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
      jest.spyOn(apartmentModel, 'find').mockReturnThis();
      jest.spyOn(apartmentModel, 'skip').mockReturnThis();
      jest.spyOn(apartmentModel, 'limit').mockReturnThis();
      jest
        .spyOn(apartmentModel, 'exec')
        .mockResolvedValueOnce(apartmentList)
        .mockResolvedValue(1);
      jest.spyOn(apartmentModel, 'countDocuments').mockReturnThis();

      const result = await apartmentRepository.getApartmentList(
        filter as ApartmentListParamsDto,
      );

      expect(result).toEqual({ total: 1, data: apartmentList });
      expect(apartmentModel.find).toHaveBeenCalledWith(query);
      expect(apartmentModel.limit).toHaveBeenCalledWith(10);
      expect(apartmentModel.skip).toHaveBeenCalledWith(0);
      expect(apartmentModel.countDocuments).toHaveBeenCalledWith(query);
      expect(apartmentModel.exec).toHaveBeenCalledTimes(2);
    });

    it.skip('should return new apartments', async () => {
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
          _id: 'cetiriZida_id1',
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
        _id: {
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
      jest.spyOn(apartmentModel, 'find').mockReturnThis();
      jest.spyOn(apartmentModel, 'skip').mockReturnThis();
      jest.spyOn(apartmentModel, 'limit').mockReturnThis();
      jest
        .spyOn(apartmentModel, 'exec')
        .mockResolvedValueOnce(apartmentList)
        .mockResolvedValue(1);
      jest.spyOn(apartmentModel, 'countDocuments').mockReturnThis();

      const result = await apartmentRepository.getApartmentList(
        filter as ApartmentListParamsDto,
        skippedApartments,
        dateFilter,
      );

      expect(result).toEqual({ total: 1, data: apartmentList });
      expect(apartmentModel.find).toHaveBeenCalledWith(query);
      expect(apartmentModel.limit).toHaveBeenCalledWith(10);
      expect(apartmentModel.skip).toHaveBeenCalledWith(0);
      expect(apartmentModel.countDocuments).toHaveBeenCalledWith(query);
      expect(apartmentModel.exec).toHaveBeenCalledTimes(2);
    });
  });
});
