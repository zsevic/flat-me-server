import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { TokenEntity } from './token.entity';
import { Token } from './token.interface';

@Injectable()
@EntityRepository(TokenEntity)
export class TokenRepository extends Repository<TokenEntity> {
  async deleteToken(tokenId: string): Promise<void> {
    await this.delete({ id: tokenId });
  }

  async getToken(token: Partial<Token>): Promise<Token> {
    const validToken = await this.findOne({
      where: {
        type: token.type,
        value: token.value,
      },
    });
    if (!validToken) throw new UnauthorizedException('Token is already used');

    return validToken;
  }

  async getUnexpiredTokenByFilterId(filterId: string): Promise<Token> {
    return this.findOne({
      where: {
        filter: filterId,
      },
    });
  }

  async saveToken(token: Token): Promise<Token> {
    return this.save(token);
  }
}
