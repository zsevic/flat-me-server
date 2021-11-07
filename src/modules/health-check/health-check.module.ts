import { RedisHealthModule } from '@liaoliaots/nestjs-redis/health';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthCheckController } from './health-check.controller';

@Module({
  imports: [TerminusModule, RedisHealthModule],
  controllers: [HealthCheckController],
})
export class HealthCheckModule {}
