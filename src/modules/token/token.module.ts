import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenRepository } from './token.repository';
import { TokenService } from './token.service';

@Module({
  imports: [TypeOrmModule.forFeature([TokenRepository])],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
