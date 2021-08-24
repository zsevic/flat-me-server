import { registerAs } from '@nestjs/config';
import { isEnvironment } from 'common/utils';

export default registerAs('database', () => ({
  MONGODB_URL: isEnvironment('test')
    ? 'mongodb://localhost:27017/flat-me-testdb'
    : process.env.MONGODB_URL || 'mongodb://localhost:27017/flat-me-server',
}));
