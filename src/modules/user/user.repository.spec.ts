import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('getUserEmail', () => {
    it('should throw an error when user is not found', async () => {
      const userId = 'userid';
      const findOneSpy = jest
        .spyOn(Repository.prototype, 'findOne')
        .mockResolvedValue(null);

      await expect(userRepository.getUserEmail(userId)).rejects.toThrowError(
        BadRequestException,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
    });

    it('should return email for found user', async () => {
      const userId = 'userid';
      const user = {
        subscription: 'FREE',
        receivedApartments: ['id1', 'id2'],
        filters: [],
        isVerified: true,
        id: userId,
        email: 'test@example.com',
      };
      const findOneSpy = jest
        .spyOn(Repository.prototype, 'findOne')
        .mockResolvedValue(user);

      const userEmail = await userRepository.getUserEmail(userId);

      expect(userEmail).toEqual(user.email);
      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
    });
  });
});
