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
import { FilterModule } from 'modules/filter/filter.module';
import { TasksModule } from 'modules/tasks/tasks.module';
import { AppController } from './app.controller';

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
    ScheduleModule.forRoot(),
    ApartmentModule,
    FilterModule,
    TasksModule,
  ],
  controllers: [AppController],
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
    private readonly connection: Connection,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async closeDatabaseConnection(): Promise<void> {
    try {
      await this.connection.close();
      this.logger.log('Database connection is closed');
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async onApplicationShutdown(signal: string): Promise<void> {
    if (!signal) return;
    this.logger.log(`Detected signal: ${signal}`);

    this.stopCronJobs();
    this.shutdownListener$.next();
    return this.closeDatabaseConnection();
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
