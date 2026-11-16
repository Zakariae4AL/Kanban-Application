import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const port = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService).get('PORT', {
    infer: true,
  });

  await app.listen(port);
  Logger.log(`API ready on http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
