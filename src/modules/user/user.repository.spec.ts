import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';

const userModel = {
  findById: jest.fn(),
  select: jest.fn(),
};

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getModelToken('User'),
          useValue: userModel,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('getReceivedApartmentsIds', () => {
    it('should return empty array when user is not found', async () => {
      const userId = 'userid';
      jest.spyOn(userModel, 'findById').mockReturnThis();
      jest.spyOn(userModel, 'select').mockResolvedValue(null);

      const apartmentsIds = await userRepository.getReceivedApartmentsIds(
        userId,
      );

      expect(apartmentsIds).toEqual([]);
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(userModel.select).toHaveBeenCalledWith('receivedApartments');
    });

    it('should return received apartments ids for found user', async () => {
      const userId = 'userid';
      const user = {
        subscription: 'FREE',
        receivedApartments: ['id1', 'id2'],
        filters: [],
        isVerified: true,
        _id: userId,
        email: 'test@example.com',
        __v: 0,
      };
      jest.spyOn(userModel, 'findById').mockReturnThis();
      jest.spyOn(userModel, 'select').mockResolvedValue(user);

      const apartmentsIds = await userRepository.getReceivedApartmentsIds(
        userId,
      );

      expect(apartmentsIds).toEqual(user.receivedApartments);
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(userModel.select).toHaveBeenCalledWith('receivedApartments');
    });
  });

  describe('getUserEmail', () => {
    it('should throw an error when user is not found', async () => {
      const userId = 'userid';
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(userRepository.getUserEmail(userId)).rejects.toThrowError(
        BadRequestException,
      );

      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should return email for found user', async () => {
      const userId = 'userid';
      const user = {
        subscription: 'FREE',
        receivedApartments: ['id1', 'id2'],
        filters: [],
        isVerified: true,
        _id: userId,
        email: 'test@example.com',
        __v: 0,
      };
      jest.spyOn(userModel, 'findById').mockResolvedValue(user);

      const userEmail = await userRepository.getUserEmail(userId);

      expect(userEmail).toEqual(user.email);
      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });
  });
});
