import { Test, TestingModule } from '@nestjs/testing';
import { TokenRepository } from './token.repository';
import { TokenService } from './token.service';

const tokenRepository = {
  deleteToken: jest.fn(),
  getUnexpiredTokenByFilterId: jest.fn(),
};

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: TokenRepository,
          useValue: tokenRepository,
        },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
  });

  describe('deleteTokenByFilterId', () => {
    it('should skip deleting token when token is not found', async () => {
      await tokenService.deleteTokenByFilterId('filterId');

      expect(tokenRepository.deleteToken).not.toHaveBeenCalled();
    });

    it('should delete token by filter id', async () => {
      const token = {
        _id: 'tokenid',
      };
      jest
        .spyOn(tokenRepository, 'getUnexpiredTokenByFilterId')
        .mockResolvedValue(token);

      await tokenService.deleteTokenByFilterId('filterId');

      expect(tokenRepository.deleteToken).toHaveBeenCalledWith(token._id);
    });
  });
});
