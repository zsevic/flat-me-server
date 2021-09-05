import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoRepository } from 'typeorm';
import { UserRepository } from './user.repository';

const userModel = {
  findById: jest.fn(),
  select: jest.fn(),
};

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('getReceivedApartmentsIds', () => {
    it('should return empty array when user is not found', async () => {
      const userId = 'userid';
      const query = {
        where: {
          _id: userId,
        },
        select: ['receivedApartments'],
      };
      const findOneSpy = jest
        .spyOn(MongoRepository.prototype, 'findOne')
        .mockResolvedValue(null);

      const apartmentsIds = await userRepository.getReceivedApartmentsIds(
        userId,
      );

      expect(apartmentsIds).toEqual([]);
      expect(findOneSpy).toHaveBeenCalledWith(query);
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
      const query = {
        where: {
          _id: userId,
        },
        select: ['receivedApartments'],
      };

      const findOneSpy = jest
        .spyOn(MongoRepository.prototype, 'findOne')
        .mockResolvedValue(user);

      const apartmentsIds = await userRepository.getReceivedApartmentsIds(
        userId,
      );

      expect(apartmentsIds).toEqual(user.receivedApartments);
      expect(findOneSpy).toHaveBeenCalledWith(query);
    });
  });

  describe('getUserEmail', () => {
    it('should throw an error when user is not found', async () => {
      const userId = 'userid';
      const findOneSpy = jest
        .spyOn(MongoRepository.prototype, 'findOne')
        .mockResolvedValue(null);

      await expect(userRepository.getUserEmail(userId)).rejects.toThrowError(
        BadRequestException,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ _id: userId });
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
      const findOneSpy = jest
        .spyOn(MongoRepository.prototype, 'findOne')
        .mockResolvedValue(user);

      const userEmail = await userRepository.getUserEmail(userId);

      expect(userEmail).toEqual(user.email);
      expect(findOneSpy).toHaveBeenCalledWith({ _id: userId });
    });
  });
});
