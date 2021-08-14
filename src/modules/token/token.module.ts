import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenRepository } from './token.repository';
import { Token, TokenSchema } from './token.schema';
import { TokenService } from './token.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  providers: [TokenRepository, TokenService],
  exports: [TokenService],
})
export class TokenModule {}
