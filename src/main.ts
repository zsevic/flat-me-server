import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as i18n from 'i18n';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { setupApiDocs } from 'common/config/api-docs';
import { i18nConfig } from 'common/config/i18n';
import { AllExceptionsFilter } from 'common/filters';
import { loggerMiddleware } from 'common/middlewares';
import { CustomValidationPipe } from 'common/pipes';
import { isEnvironment } from 'common/utils';
import { AppModule } from 'modules/app/app.module';

i18n.configure(i18nConfig);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.Console({
          level: process.env.LOG_LEVEL || 'info',
        }),
      ],
    }),
  });
  const logger = new Logger(bootstrap.name);
  const configService = app.get('configService');

  app.enableCors({
    origin: configService.get('CLIENT_URL'),
  });
  app.enableShutdownHooks();
  app.get(AppModule).subscribeToShutdown(() => app.close());

  app.setViewEngine('pug');
  app.use(i18n.init);
  app.use(loggerMiddleware);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new CustomValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      whitelist: true,
    }),
  );
  if (isEnvironment('development')) {
    setupApiDocs(app);
  }

  await app.listen(configService.get('PORT')).then(() => {
    logger.log(`Server is running on port ${configService.get('PORT')}`);
  });
}

bootstrap();

process.on('unhandledRejection', function handleUnhandledRejection(
  err: Error,
): void {
  const logger = new Logger(handleUnhandledRejection.name);
  logger.error(err.stack);
});
