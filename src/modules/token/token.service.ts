import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { promisify } from 'util';
import { TOKEN_LENGTH } from './token.constants';
import { InitialToken } from './token.interfaces';
import { Token, TokenDocument } from './token.schema';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
  ) {}

  createToken = async (validHours = 1): Promise<InitialToken> => {
    const token = await this.generateToken();
    const expiresAt = this.getExpiresAt(validHours);

    return {
      expiresAt,
      value: token,
    };
  };

  deactivateToken = async (token: TokenDocument): Promise<void> => {
    token.set({
      expiresAt: null,
    });

    await token.save();
  };

  private generateToken = async (): Promise<string> => {
    return (await randomBytesAsync(TOKEN_LENGTH))
      .toString('base64')
      .replace(/\W/g, '');
  };

  private getExpiresAt = (validHours: number): Date => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validHours);

    return expiresAt;
  };

  public getToken = async (token: string): Promise<TokenDocument> => {
    const validToken = await this.tokenModel.findOne({
      value: token,
      expiresAt: {
        $gt: new Date(),
      },
    });
    if (!validToken) throw new BadRequestException('Token is not valid');

    return validToken;
  };

  public deactivateTokenByFilterId = async (
    filterId: string,
  ): Promise<void> => {
    const validToken = await this.tokenModel.findOne({
      expiresAt: {
        $gt: new Date(),
      },
      filter: filterId,
    });
    if (!validToken) return;

    validToken.set({
      expiresAt: null,
    });

    await validToken.save();
  };

  public saveToken = async (token: Token): Promise<Token> => {
    const createdToken = new this.tokenModel({
      _id: Types.ObjectId(),
      ...token,
    });

    return createdToken.save();
  };
}
