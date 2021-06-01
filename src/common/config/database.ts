import path from 'path';
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  database: 'database.sqlite',
  entities: [path.join(__dirname, '/../../../**/*.entity.{js,ts}')],
  keepConnectionAlive: true,
  logging: false,
  // migrations: ['dist/database/migrations/*{.ts,.js}'],
  // migrationsTableName: 'migrations',
  synchronize: true,
  type: 'sqlite',
  //  url: process.env.DATABASE_URL,
}));
