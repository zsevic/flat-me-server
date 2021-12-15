import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { tokenDefaultExpiration } from './token.constants';
import { TokenRepository } from './token.repository';
import { TokenService } from './token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenRepository]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: tokenDefaultExpiration,
        },
      }),
    }),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
