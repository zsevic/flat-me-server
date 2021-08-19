import { HttpService, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  apartmentActivityBaseUrlForCetiriZida,
  apartmentActivityBaseUrlForCityExpert,
  apartmentStatusFinished,
  apartmentStatusNotAvailable,
} from './apartment.constants';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentService } from './apartment.service';

const apartmentRepository = {
  deleteApartment: jest.fn(),
};

const httpService = {
  get: jest.fn(),
  toPromise: jest.fn(),
};

describe('ApartmentService', () => {
  let apartmentService: ApartmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApartmentService,
        {
          provide: ApartmentRepository,
          useValue: apartmentRepository,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    apartmentService = module.get<ApartmentService>(ApartmentService);
  });

  describe('cetiriZida', () => {
    it('should skip deleting inactive apartment', async () => {
      const apartmentId = '1234';
      const id = `cetiriZida_${apartmentId}`;
      const url = `${apartmentActivityBaseUrlForCetiriZida}/${apartmentId}`;
      jest.spyOn(httpService, 'get').mockReturnThis();

      await apartmentService.handleDeletingInactiveApartmentFromCetiriZida(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
    });

    it('should delete inactive apartment', async () => {
      const apartmentId = '1234';
      const id = `cetiriZida_${apartmentId}`;
      const url = `${apartmentActivityBaseUrlForCetiriZida}/${apartmentId}`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest
        .spyOn(httpService, 'toPromise')
        .mockRejectedValue({ response: { status: HttpStatus.NOT_FOUND } });

      await apartmentService.handleDeletingInactiveApartmentFromCetiriZida(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(apartmentRepository.deleteApartment).toHaveBeenCalledWith(id);
    });
  });

  describe('cityExpert', () => {
    it('should skip deleting inactive apartment', async () => {
      const apartmentId = '1234';
      const id = `cityExpert_${apartmentId}-BR`;
      const url = `${apartmentActivityBaseUrlForCityExpert}/${apartmentId}/r`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest.spyOn(httpService, 'toPromise').mockResolvedValue({
        data: {
          status: 'ACTIVE',
        },
      });

      await apartmentService.handleDeletingInactiveApartmentFromCityExpert(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
    });

    it(`should delete an apartment when status is ${apartmentStatusNotAvailable}`, async () => {
      const apartmentId = '1234';
      const id = `cityExpert_${apartmentId}-BR`;
      const url = `${apartmentActivityBaseUrlForCityExpert}/${apartmentId}/r`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest.spyOn(httpService, 'toPromise').mockResolvedValue({
        data: {
          status: apartmentStatusNotAvailable,
        },
      });

      await apartmentService.handleDeletingInactiveApartmentFromCityExpert(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(apartmentRepository.deleteApartment).toHaveBeenCalledWith(id);
    });

    it(`should delete an apartment when status is ${apartmentStatusFinished}`, async () => {
      const apartmentId = '1234';
      const id = `cityExpert_${apartmentId}-BR`;
      const url = `${apartmentActivityBaseUrlForCityExpert}/${apartmentId}/r`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest.spyOn(httpService, 'toPromise').mockResolvedValue({
        data: {
          status: apartmentStatusFinished,
        },
      });

      await apartmentService.handleDeletingInactiveApartmentFromCityExpert(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(apartmentRepository.deleteApartment).toHaveBeenCalledWith(id);
    });

    it(`should delete an apartment when apartment is not found`, async () => {
      const apartmentId = '1234';
      const id = `cityExpert_${apartmentId}-BR`;
      const url = `${apartmentActivityBaseUrlForCityExpert}/${apartmentId}/r`;
      jest.spyOn(httpService, 'get').mockReturnThis();
      jest
        .spyOn(httpService, 'toPromise')
        .mockRejectedValue({ response: { status: HttpStatus.NOT_FOUND } });

      await apartmentService.handleDeletingInactiveApartmentFromCityExpert(id);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(apartmentRepository.deleteApartment).toHaveBeenCalledWith(id);
    });
  });
});
