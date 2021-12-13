import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityRepository, MoreThan, Repository } from 'typeorm';
import { TokenEntity } from './token.entity';
import { Token } from './token.interface';

@Injectable()
@EntityRepository(TokenEntity)
export class TokenRepository extends Repository<TokenEntity> {
  async deleteToken(tokenId: string): Promise<void> {
    await this.delete({ id: tokenId });
  }

  isTokenExpired = (expiresAt: Date): boolean => expiresAt < new Date();

  async getUnexpiredToken(token: string): Promise<Token> {
    const validToken = await this.findOne({
      where: {
        value: token,
      },
    });
    if (!validToken) throw new NotFoundException('Token is not found');

    if (this.isTokenExpired(new Date(validToken.expiresAt)))
      throw new UnauthorizedException('Token expired');

    return validToken;
  }

  async getUnexpiredTokenByFilterId(filterId: string): Promise<Token> {
    return this.findOne({
      where: {
        expiresAt: MoreThan(new Date()),
        filter: filterId,
      },
    });
  }

  async saveToken(token: Token): Promise<Token> {
    return this.save(token);
  }
}
