import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TOKEN_DEFAULT_EXPIRATION_HOURS } from './token.constants';
import { Token } from './token.interface';
import { TokenRepository } from './token.repository';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async createAndSaveToken(
    token: Partial<Token>,
    validHours = TOKEN_DEFAULT_EXPIRATION_HOURS,
  ): Promise<Token> {
    const value = this.jwtService.sign(
      {
        type: token.type,
        filterId: token.filterId,
      },
      {
        expiresIn: `${validHours}h`,
      },
    );

    return this.tokenRepository.saveToken({
      type: token.type,
      value,
      filterId: token.filterId,
      userId: token.userId,
    });
  }

  async deleteToken(id: string): Promise<void> {
    return this.tokenRepository.deleteToken(id);
  }

  public async deleteTokenByFilterId(filterId: string): Promise<void> {
    const validToken = await this.tokenRepository.getUnexpiredTokenByFilterId(
      filterId,
    );
    if (!validToken) return;

    return this.deleteToken(validToken.id);
  }

  public async getValidToken(token: Partial<Token>): Promise<Token> {
    try {
      const verifiedToken = this.jwtService.verify(token.value);
      if (verifiedToken.type !== token.type) {
        throw new Error('Token type is not valid');
      }
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Token is not valid');
    }

    return this.tokenRepository.getToken(token);
  }
}
