import {
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import * as Joi from 'joi';
import { Connection } from 'mongoose';
import { Subject } from 'rxjs';
import databaseConfig from 'common/config/database';
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
          MONGODB_URL: Joi.string()
            .uri()
            .required(),
          NODE_ENV: Joi.string()
            .valid('production', 'development', 'test')
            .default('development')
            .required(),
          PORT: Joi.number().required(),
          SENDGRID_API_KEY: Joi.string().required(),
        }),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          load: [databaseConfig],
        }),
      ],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('database.MONGODB_URL'),
        useCreateIndex: true,
        useFindAndModify: false,
      }),
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
  ],
})
@Injectable()
export class AppModule implements OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);
  private readonly shutdownListener$: Subject<void> = new Subject();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async closeDatabaseConnection(): Promise<void> {
    await this.connection
      .close()
      .then(() => this.logger.log('Database connection is closed'));
  }

  onApplicationShutdown = async (signal: string): Promise<void> => {
    if (!signal) return;
    this.logger.log(`Detected signal: ${signal}`);

    this.stopCronJobs();
    this.shutdownListener$.next();
    await this.closeDatabaseConnection();
  };

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
