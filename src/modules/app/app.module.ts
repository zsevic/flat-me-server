import {
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { Subject } from 'rxjs';
import { Connection } from 'typeorm';
import databaseConfig from 'common/config/database';
import { PostgresConfigService } from 'common/config/database/postgres-config.service';
import { isEnvironment } from 'common/utils';
import { ApartmentModule } from 'modules/apartment/apartment.module';
import { FeedbackModule } from 'modules/feedback/feedback.module';
import { FilterModule } from 'modules/filter/filter.module';
import { SubscriptionModule } from 'modules/subscription/subscription.module';
import { TasksModule } from 'modules/tasks/tasks.module';

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
          EMAIL_HOST: Joi.string()
            .domain()
            .required(),
          EMAIL_PASSWORD: Joi.string().required(),
          EMAIL_PORT: Joi.number().required(),
          ...(isEnvironment('production') && {
            EMAIL_SECURE: Joi.bool().required(),
          }),
          EMAIL_USERNAME: Joi.string().required(),
          JWT_SECRET: Joi.string().required(),
          NODE_ENV: Joi.string()
            .valid('production', 'development', 'test')
            .default('development')
            .required(),
          PORT: Joi.number().required(),
          UPSTASH_REDIS_URL: Joi.string()
            .uri()
            .required(),
          SENDGRID_API_KEY: Joi.string().required(),
          SENDGRID_MAILING_ID: Joi.string().required(),
          SENTRY_DSN: Joi.string().required(),
          SERVICE_ACCOUNT_KEY: Joi.string().required(),
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
    ScheduleModule.forRoot(),
    ApartmentModule,
    FeedbackModule,
    FilterModule,
    TasksModule,
    SubscriptionModule,
  ],
  providers: [
    {
      provide: 'configService',
      useFactory: () => new ConfigService(),
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
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async closeDatabaseConnection(): Promise<void> {
    await this.databaseConnection.close();
    this.logger.log('Database connection is closed');
  }

  async onApplicationShutdown(signal: string): Promise<void> {
    if (!signal) return;
    this.logger.log(`Detected signal: ${signal}`);

    this.stopCronJobs();
    this.shutdownListener$.next();
    await Promise.all([this.closeDatabaseConnection()]).catch(error =>
      this.logger.error(error.message),
    );
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
