import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { EnvironmentVariables } from './config/env.validation';

/** Shared by main.ts and the end-to-end tests, so tests run the real configuration. */
export function configureApp(app: INestApplication): INestApplication {
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // ...and reject requests that send them
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  return app;
}
