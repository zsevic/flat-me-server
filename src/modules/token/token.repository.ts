import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { TokenEntity } from './token.entity';
import { Token } from './token.interface';

@Injectable()
@EntityRepository(TokenEntity)
export class TokenRepository extends Repository<TokenEntity> {
  async deleteToken(tokenId: string): Promise<void> {
    await this.delete({ id: tokenId });
  }

  async getUnexpiredToken(token: string): Promise<Token> {
    const validToken = await this.findOne({
      where: {
        value: token,
        expiresAt: {
          $gt: new Date(),
        },
      },
    });
    if (!validToken) throw new BadRequestException('Token is not valid');

    return validToken;
  }

  async getUnexpiredTokenByFilterId(filterId: string): Promise<Token> {
    return this.findOne({
      where: {
        expiresAt: {
          $gt: new Date(),
        },
        filter: filterId,
      },
    });
  }

  async saveToken(token: Token): Promise<Token> {
    return this.save(token);
  }
}
