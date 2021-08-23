import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

const userRepository = {
  getUserEmail: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  describe('getUserByEmail', () => {
    it('should throw an error if user is not found', async () => {
      jest
        .spyOn(userRepository, 'getUserEmail')
        .mockRejectedValue(new BadRequestException());

      await expect(userService.getUserEmail('userId')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw an error if user is not found', async () => {
      const email = 'test@example.com';
      jest.spyOn(userRepository, 'getUserEmail').mockResolvedValue(email);

      const userEmail = await userService.getUserEmail('userId');

      expect(userEmail).toEqual(email);
    });
  });
});
