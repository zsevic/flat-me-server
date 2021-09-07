import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Apartment } from 'modules/apartment/apartment.interface';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

const userRepository = {
  getByEmail: jest.fn(),
  getById: jest.fn(),
  getUserEmail: jest.fn(),
  insertReceivedApartmentsIds: jest.fn(),
  saveUser: jest.fn(),
  verifyUser: jest.fn(),
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

      await expect(userService.getUserEmail('userId')).rejects.toThrowError(
        BadRequestException,
      );
    });

    it("should return user's email", async () => {
      const email = 'test@example.com';
      jest.spyOn(userRepository, 'getUserEmail').mockResolvedValue(email);

      const userEmail = await userService.getUserEmail('userId');

      expect(userEmail).toEqual(email);
    });
  });

  describe('getVerifiedOrCreateNewUser', () => {
    it('should create a new user when verified user is not found', async () => {
      const email = 'test@example.com';
      const userId = 'userid';
      const userData = {
        subscription: 'FREE',
        receivedApartments: [],
        filters: [],
        isVerified: false,
        id: userId,
        email,
      };
      jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'saveUser').mockResolvedValue(userData);

      const user = await userService.getVerifiedUserOrCreateNewUser(email);

      expect(user).toMatchObject(userData);
      expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
      expect(userRepository.saveUser).toHaveBeenCalledWith(email);
    });

    it('should throw an error when user is found but found user is not verified', async () => {
      const email = 'test@example.com';
      const userId = 'userid';
      const userData = {
        subscription: 'FREE',
        receivedApartments: [],
        filters: [],
        isVerified: false,
        id: userId,
        email,
      };
      jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(userData);

      await expect(
        userService.getVerifiedUserOrCreateNewUser(email),
      ).rejects.toThrowError(BadRequestException);

      expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    });

    it("should throw an error when user is verified but user's subscription is not allowed", async () => {
      const email = 'test@example.com';
      const userId = 'userid';
      const userData = {
        subscription: 'Test',
        receivedApartments: [],
        filters: [],
        isVerified: true,
        id: userId,
        email,
      };
      jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(userData);

      await expect(
        userService.getVerifiedUserOrCreateNewUser(email),
      ).rejects.toThrowError(BadRequestException);

      expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw an error when user is verified but adding more filters is not allowed', async () => {
      const email = 'test@example.com';
      const userId = 'userid';
      const userData = {
        subscription: 'FREE',
        receivedApartments: [],
        filters: ['id1'],
        isVerified: true,
        id: userId,
        email,
      };
      jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(userData);

      await expect(
        userService.getVerifiedUserOrCreateNewUser(email),
      ).rejects.toThrowError(BadRequestException);

      expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    });

    it('should return verified user', async () => {
      const email = 'test@example.com';
      const userId = 'userid';
      const userData = {
        subscription: 'FREE',
        receivedApartments: [],
        filters: [],
        isVerified: true,
        id: userId,
        email,
      };
      jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(userData);

      const verifiedUser = await userService.getVerifiedUserOrCreateNewUser(
        email,
      );

      expect(verifiedUser).toEqual(userData);
      expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('insertReceivedApartmentsIds', () => {
    it('should insert received apartments', async () => {
      const apartmentList = [
        {
          heatingTypes: ['central'],
          id: 'id1',
          price: 350,
          apartmentId: 'id1',
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
        },
      ];
      const userId = 'id1';
      await userService.insertReceivedApartmentsIds(
        userId,
        apartmentList as Apartment[],
      );

      expect(userRepository.insertReceivedApartmentsIds).toHaveBeenCalledWith(
        userId,
        apartmentList,
      );
    });
  });

  describe('verifyUser', () => {
    it('should throw an error when user is not found', async () => {
      const userId = 'id1';
      jest.spyOn(userRepository, 'getById').mockResolvedValue(null);

      await expect(userService.verifyUser(userId)).rejects.toThrowError(
        BadRequestException,
      );

      expect(userRepository.getById).toHaveBeenCalledWith(userId);
    });

    it('should return when found user is already verified', async () => {
      const userId = 'id1';
      const userData = {
        subscription: 'FREE',
        receivedApartments: [],
        filters: [],
        isVerified: true,
        id: userId,
        email: 'test@example.com',
      };
      jest.spyOn(userRepository, 'getById').mockResolvedValue(userData);

      await userService.verifyUser(userId);

      expect(userRepository.getById).toHaveBeenCalledWith(userId);
      expect(userRepository.verifyUser).not.toHaveBeenCalled();
    });

    it('should verify found user', async () => {
      const userId = 'id1';
      const userData = {
        subscription: 'FREE',
        receivedApartments: [],
        filters: [],
        isVerified: false,
        id: userId,
        email: 'test@example.com',
      };
      jest.spyOn(userRepository, 'getById').mockResolvedValue(userData);

      await userService.verifyUser(userId);

      expect(userRepository.getById).toHaveBeenCalledWith(userId);
      expect(userRepository.verifyUser).toHaveBeenCalledWith(userData);
    });
  });
});
