import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ApartmentRepository } from './apartment.repository';

const apartmentModel = {
  find: jest.fn(),
  select: jest.fn(),
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

  describe('getApartmentsIds', () => {
    it('should return list of found apartments ids', async () => {
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
      jest.spyOn(apartmentModel, 'select').mockResolvedValue(apartmentList);

      const ids = await apartmentRepository.getApartmentsIds();

      expect(ids).toEqual(apartmentsIds);
      expect(apartmentModel.find).toHaveBeenCalled();
      expect(apartmentModel.select).toHaveBeenCalledWith('_id');
    });
  });
});
