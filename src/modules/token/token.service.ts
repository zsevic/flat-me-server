import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { Injectable } from '@nestjs/common';
import { TOKEN_LENGTH } from './token.constants';
import { Token } from './token.interface';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class TokenService {
  async createToken(): Promise<Token> {
    const token = await this.generateToken();
    const expiresAt = this.getExpiresAt();

    return {
      expiresAt,
      value: token,
    };
  }

  private generateToken = async (): Promise<string> => {
    return (await randomBytesAsync(TOKEN_LENGTH))
      .toString('base64')
      .replace(/\W/g, '');
  };

  private getExpiresAt = (): Date => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    return expiresAt;
  };
}
