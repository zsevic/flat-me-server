import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { isEnvironment } from 'common/utils';
import path from 'path';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';

@Injectable()
export class PostgresConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    initializeTransactionalContext();
    patchTypeORMRepositoryWithBaseRepository();

    return {
      type: 'postgres',
      url: this.configService.get<string>('database.url'),
      entities: [path.join(__dirname, '/../../../**/*.entity.{js,ts}')],
      keepConnectionAlive: true,
      logging: false,
      migrations: [
        path.resolve(`${__dirname}/../../../../database/migrations/*{.ts,.js}`),
      ],
      migrationsTableName: 'migrations',
      migrationsRun: true,
      synchronize: false,
    };
  }
}
