import { Test, TestingModule } from '@nestjs/testing';
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
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(userRepository.getUserEmail(userId)).rejects.toThrowError();

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
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(user);

      const userEmail = await userRepository.getUserEmail(userId);

      expect(userEmail).toEqual(user.email);
      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
    });
  });
});
