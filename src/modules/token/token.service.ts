import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { TOKEN_DEFAULT_EXPIRATION_HOURS } from './token.constants';
import { Token } from './token.interface';
import { TokenRepository } from './token.repository';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenRepository)
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
      this.jwtService.verify(token.value);
      return this.tokenRepository.getToken(token);
    } catch (error) {
      throw new BadRequestException('Token is not valid');
    }
  }
}
