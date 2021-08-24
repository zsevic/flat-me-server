import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenRepository } from './token.repository';

const tokenModel = {
  findOne: jest.fn(),
};

describe('TokenRepository', () => {
  let tokenRepository: TokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenRepository,
        {
          provide: getModelToken('Token'),
          useValue: tokenModel,
        },
      ],
    }).compile();

    tokenRepository = module.get<TokenRepository>(TokenRepository);
  });

  describe('getUnexpiredToken', () => {
    it('should throw an error if unexpired token is not found', async () => {
      const token = 'token';
      const date = new Date(1629843303410);
      const query = {
        expiresAt: { $gt: date },
        value: token,
      };
      jest.spyOn(tokenModel, 'findOne').mockResolvedValue(null);
      // @ts-ignore
      jest.spyOn(global, 'Date').mockReturnValue(date);

      await expect(
        tokenRepository.getUnexpiredToken(token),
      ).rejects.toThrowError(BadRequestException);
      expect(tokenModel.findOne).toHaveBeenCalledWith(query);
    });

    it('should return unexpired token', async () => {
      const tokenValue = 'token';
      const date = new Date(1629843303410);
      const query = {
        expiresAt: { $gt: date },
        value: tokenValue,
      };
      const token = {
        value: tokenValue,
        filter: 'filterid',
        user: 'userid',
      };
      jest.spyOn(tokenModel, 'findOne').mockResolvedValue(token);
      // @ts-ignore
      jest.spyOn(global, 'Date').mockReturnValue(date);

      const unexpiredToken = await tokenRepository.getUnexpiredToken(
        tokenValue,
      );

      expect(unexpiredToken).toEqual(token);
      expect(tokenModel.findOne).toHaveBeenCalledWith(query);
    });
  });
});
