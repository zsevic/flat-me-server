import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ThrottlerStorageService } from './throttler-storage.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get('UPSTASH_REDIS_URL');

        return {
          config: {
            url: redisUrl,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [ThrottlerStorageService],
  exports: [ThrottlerStorageService],
})
export class ThrottlerStorageModule {}
