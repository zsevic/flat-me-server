import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
import { UserService } from 'modules/user/user.service';
import { SaveFilterDto } from './dto/save-filter.dto';
import { RentOrSale } from './filter.enums';
import { FilterRepository } from './filter.repository';
import { FilterService } from './filter.service';

const filterRepository = {
  deactivateFilter: jest.fn(),
  findFilterById: jest.fn(),
  findUnverifiedFilter: jest.fn(),
  saveFilter: jest.fn(),
  verifyAndActivateFilter: jest.fn(),
};

const mailService = {
  sendFilterVerificationMail: jest.fn(),
};

const tokenService = {
  createAndSaveToken: jest.fn(),
  deleteToken: jest.fn(),
  getValidToken: jest.fn(),
};

const userService = {
  getVerifiedUserOrCreateNewUser: jest.fn(),
  verifyUser: jest.fn(),
};

describe('FilterService', () => {
  let filterService: FilterService;
  const clientUrl = 'client-url';

  beforeAll(() => {
    process.env.CLIENT_URL = clientUrl;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilterService,
        {
          provide: FilterRepository,
          useValue: filterRepository,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        {
          provide: TokenService,
          useValue: tokenService,
        },
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    filterService = module.get<FilterService>(FilterService);
  });

  describe('createFilterAndSendVerificationMail', () => {
    it('should create filter and send verification mail', async () => {
      const userId = 'userid';
      const filterId = 'id1';
      const email = 'email@email.com';
      const filter = {
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
      };
      const filterDto = {
        ...filter,
        email,
      };
      const newFilter = {
        ...filter,
        userId,
        isActive: false,
        isVerified: false,
      };
      const savedFilter = {
        ...newFilter,
        id: filterId,
        createdAt: '2021-08-22T20:59:57.918Z',
        updatedAt: '2021-08-22T20:59:57.918Z',
      };
      const user = {
        subscription: 'FREE',
        receivedApartments: [],
        filters: [],
        isVerified: false,
        id: userId,
        email: 'test@example.com',
      };
      const token = 'token';
      jest
        .spyOn(userService, 'getVerifiedUserOrCreateNewUser')
        .mockResolvedValue(user);
      jest.spyOn(filterRepository, 'saveFilter').mockResolvedValue(savedFilter);
      jest
        .spyOn(tokenService, 'createAndSaveToken')
        .mockResolvedValue({ value: token });

      await filterService.createFilterAndSendVerificationMail(
        filterDto as SaveFilterDto,
      );

      expect(userService.getVerifiedUserOrCreateNewUser).toHaveBeenCalledWith(
        email,
      );
      expect(filterRepository.saveFilter).toHaveBeenCalledWith(newFilter);
      expect(tokenService.createAndSaveToken).toHaveBeenCalledWith({
        filter: filterId,
        user: userId,
      });
      expect(mailService.sendFilterVerificationMail).toHaveBeenCalledWith(
        email,
        token,
      );
    });
  });

  describe('deactivateFilterByToken', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should throw an error when token is not found', async () => {
      const token = 'token';
      jest
        .spyOn(tokenService, 'getValidToken')
        .mockRejectedValue(new BadRequestException());

      await expect(
        filterService.deactivateFilterByToken(token),
      ).rejects.toThrowError(BadRequestException);
      expect(tokenService.getValidToken).toHaveBeenCalledWith(token);
    });

    it('should throw an error when filter is not found', async () => {
      const filterId = 'id1';
      const token = {
        filter: filterId,
        value: 'token',
      };
      jest.spyOn(tokenService, 'getValidToken').mockResolvedValue(token);
      jest
        .spyOn(filterRepository, 'deactivateFilter')
        .mockRejectedValue(new BadRequestException('Filter is not found'));

      await expect(
        filterService.deactivateFilterByToken(token.value),
      ).rejects.toThrowError(BadRequestException);
      expect(tokenService.getValidToken).toHaveBeenCalledWith(token.value);
      expect(filterRepository.deactivateFilter).toHaveBeenCalledWith(
        token.filter,
      );
    });

    it('should deactivate found filter', async () => {
      const filterId = '611c59c26962b452247b9432';
      const foundFilter = {
        id: filterId,
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: '2021-08-18T00:52:18.296Z',
      };
      const token = {
        filter: filterId,
        value: 'token',
        id: 'tokenid',
      };
      jest.spyOn(tokenService, 'getValidToken').mockResolvedValue(token);

      await filterService.deactivateFilterByToken(token.value);

      expect(tokenService.getValidToken).toHaveBeenCalledWith(token.value);
      expect(filterRepository.deactivateFilter).toHaveBeenCalledWith(
        foundFilter.id,
      );
      expect(tokenService.deleteToken).toHaveBeenCalledWith(token.id);
    });
  });

  describe('getDeactivationUrl', () => {
    it('should return deactivation url by given filter', async () => {
      const tokenValue = 'token';
      const filterId = 'id1';
      const expirationHours = 24;
      jest.spyOn(tokenService, 'createAndSaveToken').mockResolvedValue({
        value: tokenValue,
      });

      const deactivationUrl = await filterService.getDeactivationUrl(
        filterId,
        expirationHours,
      );

      expect(deactivationUrl).toEqual(
        `${clientUrl}/filters/deactivation/${tokenValue}`,
      );
      expect(tokenService.createAndSaveToken).toHaveBeenCalledWith(
        { filter: filterId },
        expirationHours,
      );
    });
  });

  describe('getInitialFilter', () => {
    it('should return initial filter', () => {
      const filter = {
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: RentOrSale.rent,
        minPrice: 120,
        maxPrice: 370,
      };
      const initialFilter = filterService.getInitialFilter(filter);

      expect(initialFilter).toEqual({ ...filter, pageNumber: 1 });
    });
  });

  describe('verifyFilter', () => {
    it('should throw an error when token is not found', async () => {
      const token = 'token';
      jest
        .spyOn(tokenService, 'getValidToken')
        .mockRejectedValue(new BadRequestException());

      await expect(filterService.verifyFilter(token)).rejects.toThrowError(
        BadRequestException,
      );
    });

    it('should throw an error when unverified filter is not found', async () => {
      const filterId = 'id1';
      const userId = 'user1';
      const token = {
        filter: filterId,
        user: userId,
        value: 'token',
      };
      jest.spyOn(tokenService, 'getValidToken').mockResolvedValue(token);
      jest
        .spyOn(filterRepository, 'findUnverifiedFilter')
        .mockRejectedValue(new BadRequestException());

      await expect(
        filterService.verifyFilter(token.value),
      ).rejects.toThrowError(BadRequestException);
    });

    it("should throw an error when filter's user is not found", async () => {
      const filterId = 'id1';
      const userId = 'user1';
      const token = {
        filter: filterId,
        user: userId,
        value: 'token',
      };
      const foundFilter = {
        id: filterId,
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: '2021-08-18T00:52:18.296Z',
      };
      jest.spyOn(tokenService, 'getValidToken').mockResolvedValue(token);
      jest
        .spyOn(filterRepository, 'findUnverifiedFilter')
        .mockResolvedValue(foundFilter);
      jest
        .spyOn(userService, 'verifyUser')
        .mockRejectedValue(new BadRequestException());

      await expect(
        filterService.verifyFilter(token.value),
      ).rejects.toThrowError(BadRequestException);

      expect(tokenService.getValidToken).toHaveBeenCalledWith(token.value);
      expect(filterRepository.verifyAndActivateFilter).toHaveBeenCalledWith(
        foundFilter,
      );
      expect(userService.verifyUser).toHaveBeenCalledWith(token.user);
    });

    it('should verify and activate found filter', async () => {
      const filterId = 'id1';
      const userId = 'user1';
      const token = {
        filter: filterId,
        user: userId,
        value: 'token',
      };
      const foundFilter = {
        id: filterId,
        structures: [1, 2, 0.5, 1.5],
        municipalities: ['Savski venac', 'Zemun'],
        furnished: ['semi-furnished'],
        rentOrSale: 'rent',
        minPrice: 120,
        maxPrice: 370,
        user: '611c59c26962b452247b9431',
        createdAt: '2021-08-18T00:52:18.296Z',
      };
      jest.spyOn(tokenService, 'getValidToken').mockResolvedValue(token);
      jest
        .spyOn(filterRepository, 'findUnverifiedFilter')
        .mockResolvedValue(foundFilter);
      jest.spyOn(userService, 'verifyUser').mockResolvedValue(undefined);

      await filterService.verifyFilter(token.value);

      expect(tokenService.getValidToken).toHaveBeenCalledWith(token.value);
      expect(filterRepository.verifyAndActivateFilter).toHaveBeenCalledWith(
        foundFilter,
      );
      expect(userService.verifyUser).toHaveBeenCalledWith(token.user);
    });
  });
});
