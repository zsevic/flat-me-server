import {
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import * as Joi from 'joi';
import { Subject } from 'rxjs';
import { Connection } from 'typeorm';
import databaseConfig from 'common/config/database';
import { PostgresConfigService } from 'common/config/database/postgres-config.service';
import { isEnvironment } from 'common/utils';
import { ApartmentModule } from 'modules/apartment/apartment.module';
import { FilterModule } from 'modules/filter/filter.module';
import { TasksModule } from 'modules/tasks/tasks.module';
import { ThrottlerStorageModule } from 'modules/throttler-storage/throttler-storage.module';
import { ThrottlerStorageService } from 'modules/throttler-storage/throttler-storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ...(!isEnvironment('test') && {
        validationSchema: Joi.object({
          CLIENT_URL: Joi.string()
            .uri()
            .required(),
          DATABASE_URL: Joi.string()
            .uri()
            .required(),
          NODE_ENV: Joi.string()
            .valid('production', 'development', 'test')
            .default('development')
            .required(),
          PORT: Joi.number().required(),
          REDIS_URL: Joi.string()
            .uri()
            .required(),
          SENDGRID_API_KEY: Joi.string().required(),
          SENTRY_DSN: Joi.string().required(),
        }),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          load: [databaseConfig],
        }),
      ],
      useClass: PostgresConfigService,
      inject: [PostgresConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ThrottlerStorageModule],
      useFactory: (throttlerStorage: ThrottlerStorageService) => {
        return {
          ttl: 60 * 60 * 24,
          limit: 3,
          storage: throttlerStorage,
        };
      },
      inject: [ThrottlerStorageService],
    }),
    ScheduleModule.forRoot(),
    ApartmentModule,
    FilterModule,
    TasksModule,
  ],
  providers: [
    {
      provide: 'configService',
      useFactory: () => new ConfigService(),
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    PostgresConfigService,
  ],
})
@Injectable()
export class AppModule implements OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);
  private readonly shutdownListener$: Subject<void> = new Subject();

  constructor(
    private readonly databaseConnection: Connection,
    @InjectRedis() private readonly redisConnection: Redis,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async closeDatabaseConnection(): Promise<void> {
    await this.databaseConnection.close();
    this.logger.log('Database connection is closed');
  }

  async closeRedisConnection(): Promise<void> {
    await this.redisConnection.quit();
    this.logger.log('Redis connection is closed');
  }

  async onApplicationShutdown(signal: string): Promise<void> {
    if (!signal) return;
    this.logger.log(`Detected signal: ${signal}`);

    this.stopCronJobs();
    this.shutdownListener$.next();
    await Promise.all([
      this.closeDatabaseConnection(),
      this.closeRedisConnection(),
    ]).catch(error => this.logger.error(error.message));
  }

  stopCronJobs(): void {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((job, jobName) => {
      job.stop();
      this.logger.log(`Cron job "${jobName}" is stopped`);
    });
  }

  subscribeToShutdown = (shutdownFn: () => void): void => {
    this.shutdownListener$.subscribe(() => {
      this.logger.log('App is closed');
      shutdownFn();
    });
  };
}
