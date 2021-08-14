import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { TOKEN_LENGTH } from './token.constants';
import { InitialToken } from './token.interfaces';
import { TokenRepository } from './token.repository';
import { Token, TokenDocument } from './token.schema';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class TokenService {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async createToken(validHours = 1): Promise<InitialToken> {
    const token = await this.generateToken();
    const expiresAt = this.generateExpiresAt(validHours);

    return {
      expiresAt,
      value: token,
    };
  }

  async deactivateToken(token: TokenDocument): Promise<void> {
    return this.tokenRepository.deactivateToken(token);
  }

  private generateToken = async (): Promise<string> => {
    return (await randomBytesAsync(TOKEN_LENGTH))
      .toString('base64')
      .replace(/\W/g, '');
  };

  private generateExpiresAt = (validHours: number): Date => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validHours);

    return expiresAt;
  };

  public async getValidToken(token: string): Promise<TokenDocument> {
    return this.tokenRepository.getUnexpiredToken(token);
  }

  public deactivateTokenByFilterId = async (
    filterId: string,
  ): Promise<void> => {
    const validToken = await this.tokenRepository.getUnexpiredTokenByFilterId(
      filterId,
    );
    if (!validToken) return;

    return this.tokenRepository.deactivateToken(validToken);
  };

  public async saveToken(token: Token): Promise<Token> {
    return this.tokenRepository.saveToken(token);
  }
}
