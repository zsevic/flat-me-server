import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  MONGODB_URL:
    process.env.MONGODB_URL || 'mongodb://localhost:27017/flat-me-server',
}));
