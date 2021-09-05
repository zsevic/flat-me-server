import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import path from 'path';

@Injectable()
export class MongoDBConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mongodb',
      url: this.configService.get<string>('database.MONGODB_URL'),
      entities: [path.join(__dirname, '/../../../**/*.entity.{js,ts}')],
      useUnifiedTopology: true,
    };
  }
}
