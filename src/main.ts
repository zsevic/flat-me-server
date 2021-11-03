import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import compression from 'compression';
import helmet from 'helmet';
import * as i18n from 'i18n';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { setupApiDocs } from 'common/config/api-docs';
import { i18nConfig } from 'common/config/i18n';
import { AllExceptionsFilter } from 'common/filters';
import { loggerMiddleware, sslRedirect } from 'common/middlewares';
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

  app.enable('trust proxy'); // used for rate limiter
  app.enableCors({
    origin: configService.get('CLIENT_URL'),
  });
  app.enableShutdownHooks();
  app.get(AppModule).subscribeToShutdown(() => app.close());

  app.setViewEngine('pug');
  app.use(compression());
  app.use(helmet());
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

  if (isEnvironment('production')) {
    app.use(sslRedirect());
    Sentry.init({
      dsn: configService.get('SENTRY_DSN'),
    });
  }

  const PORT = configService.get('PORT') || 8080;
  await app.listen(PORT, '0.0.0.0').then(() => {
    logger.log(`Server is running on port ${PORT}`);
  });
}

bootstrap();

process.on('unhandledRejection', function handleUnhandledRejection(
  err: Error,
): void {
  const logger = new Logger(handleUnhandledRejection.name);
  logger.error(err.stack);
});
