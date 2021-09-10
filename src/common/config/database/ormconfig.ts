import 'dotenv/config';
import path from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const config: PostgresConnectionOptions = {
  name: 'migration',
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.resolve(`${__dirname}/../../../**/**.entity{.ts,.js}`)],
  migrations: [
    path.resolve(`${__dirname}/../../../../database/migrations/*{.ts,.js}`),
  ],
  migrationsTableName: 'migrations',
  cli: {
    migrationsDir: path.resolve(`${__dirname}/../../../../database/migrations`),
  },
  logging: true,
  synchronize: false,
};

export default config;
