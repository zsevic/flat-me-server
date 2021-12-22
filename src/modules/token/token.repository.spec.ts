import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenEntity } from './token.entity';
import { TokenRepository } from './token.repository';

describe('TokenRepository', () => {
  let tokenRepository: TokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenRepository],
    }).compile();

    tokenRepository = module.get<TokenRepository>(TokenRepository);
  });

  describe('getUnexpiredToken', () => {
    it('should throw an error when token is not found', async () => {
      const token = 'token';
      const query = {
        where: {
          value: token,
        },
      };
      const findOneSpy = jest
        .spyOn(tokenRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(
        tokenRepository.getToken({
          value: token,
        }),
      ).rejects.toThrowError(UnauthorizedException);
      expect(findOneSpy).toHaveBeenCalledWith(query);
    });

    it('should return unexpired token', async () => {
      const tokenValue = 'token';
      const query = {
        where: {
          value: tokenValue,
        },
      };
      const token = {
        value: tokenValue,
        filterId: 'filterid',
        userId: 'userid',
      };
      const findOneSpy = jest
        .spyOn(tokenRepository, 'findOne')
        .mockResolvedValue(token as TokenEntity);

      const unexpiredToken = await tokenRepository.getToken({
        value: tokenValue,
      });

      expect(unexpiredToken).toEqual(token);
      expect(findOneSpy).toHaveBeenCalledWith(query);
    });
  });
});
