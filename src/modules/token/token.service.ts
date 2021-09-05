import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { TOKEN_LENGTH } from './token.constants';
import { Token } from './token.interface';
import { TokenRepository } from './token.repository';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class TokenService {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async createAndSaveToken(
    token: Partial<Token>,
    validHours = 1,
  ): Promise<Token> {
    const generatedToken = await this.generateToken();
    const expiresAt = this.generateExpiresAt(validHours);

    return this.tokenRepository.saveToken({
      expiresAt,
      value: generatedToken,
      ...token,
    });
  }

  async deleteToken(id: string): Promise<void> {
    return this.tokenRepository.deleteToken(id);
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

  public async getValidToken(token: string): Promise<Token> {
    return this.tokenRepository.getUnexpiredToken(token);
  }

  public async deleteTokenByFilterId(filterId: string): Promise<void> {
    const validToken = await this.tokenRepository.getUnexpiredTokenByFilterId(
      filterId,
    );
    if (!validToken) return;

    return this.deleteToken(validToken._id);
  }
}
