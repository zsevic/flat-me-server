import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MoreThan, Repository } from 'typeorm';
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
    it('should throw an error if unexpired token is not found', async () => {
      const token = 'token';
      const date = new Date(1629843303410);
      const query = {
        where: {
          expiresAt: MoreThan(date),
          value: token,
        },
      };
      const findOneSpy = jest
        .spyOn(Repository.prototype, 'findOne')
        .mockResolvedValue(null);
      // @ts-ignore
      jest.spyOn(global, 'Date').mockReturnValue(date);

      await expect(
        tokenRepository.getUnexpiredToken(token),
      ).rejects.toThrowError(BadRequestException);
      expect(findOneSpy).toHaveBeenCalledWith(query);
    });

    it('should return unexpired token', async () => {
      const tokenValue = 'token';
      const date = new Date(1629843303410);
      const query = {
        where: {
          expiresAt: MoreThan(date),
          value: tokenValue,
        },
      };
      const token = {
        value: tokenValue,
        filter: 'filterid',
        user: 'userid',
      };
      const findOneSpy = jest
        .spyOn(Repository.prototype, 'findOne')
        .mockResolvedValue(token);
      // @ts-ignore
      jest.spyOn(global, 'Date').mockReturnValue(date);

      const unexpiredToken = await tokenRepository.getUnexpiredToken(
        tokenValue,
      );

      expect(unexpiredToken).toEqual(token);
      expect(findOneSpy).toHaveBeenCalledWith(query);
    });
  });
});
