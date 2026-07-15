import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { createValidationPipe } from './common/pipes/validation.pipe';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression') as typeof import('compression');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const helmet = require('helmet') as typeof import('helmet').default;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const apiPrefix = configService.get<string>('apiPrefix', 'api');
  const apiVersion = configService.get<string>('apiVersion', 'v1');

  // Global prefix: /api/v1
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  const corsOrigins = configService.get<string[]>('cors.origins', ['http://localhost:3001']);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation
  app.useGlobalPipes(createValidationPipe());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FixHub API')
    .setDescription('Hyperlocal Electrical & Home Appliance Repair Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & OTP')
    .addTag('Users', 'Authenticated user management')
    .addTag('Customer', 'Customer profile & addresses')
    .addTag('Technician', 'Technician profile & job management')
    .addTag('Bookings', 'Booking lifecycle')
    .addTag('Payments', 'Payment processing')
    .addTag('Notifications', 'Push notifications')
    .addTag('Admin', 'Admin panel operations')
    .addTag('Reporting', 'Reports & analytics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 FixHub API running on http://localhost:${port}/${apiPrefix}/${apiVersion}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
