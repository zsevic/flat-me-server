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

  async createToken(): Promise<InitialToken> {
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

  public getToken = async (token: string): Promise<Token> => {
    const validToken = await this.tokenModel.findOne({
      value: token,
      expiresAt: {
        $gt: new Date(),
      },
    });
    if (!validToken) throw new BadRequestException('Token is not valid');

    return validToken;
  };

  public saveToken = async (token: Token): Promise<Token> => {
    const createdToken = new this.tokenModel({
      _id: Types.ObjectId(),
      ...token,
    });

    return createdToken.save();
  };
}
