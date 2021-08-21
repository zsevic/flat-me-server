import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Token, TokenDocument } from './token.schema';

@Injectable()
export class TokenRepository {
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
  ) {}

  async deleteToken(token: TokenDocument): Promise<void> {
    await token.remove();
  }

  async getUnexpiredToken(token: string): Promise<TokenDocument> {
    const validToken = await this.tokenModel.findOne({
      value: token,
      expiresAt: {
        $gt: new Date(),
      },
    });
    if (!validToken) throw new BadRequestException('Token is not valid');

    return validToken;
  }

  async getUnexpiredTokenByFilterId(filterId: string): Promise<TokenDocument> {
    return this.tokenModel.findOne({
      expiresAt: {
        $gt: new Date(),
      },
      filter: filterId,
    });
  }

  async saveToken(token: Token): Promise<Token> {
    const createdToken = new this.tokenModel({
      _id: Types.ObjectId(),
      ...token,
    });

    return createdToken.save();
  }
}
