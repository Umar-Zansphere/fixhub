import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard,ThrottlerModule } from '@nestjs/throttler';

// Common modules
import { ConfigModule } from './common/config/config.module';
import { PrismaModule } from './common/database/prisma.module';
// Common providers
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { QueueModule } from './common/queue/queue.module';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { AdminModule } from './modules/admin/admin.module';
// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CustomerModule } from './modules/customer/customer.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { TechnicianModule } from './modules/technician/technician.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Infrastructure
    ConfigModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    StorageModule,

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60) * 1000,
          limit: configService.get<number>('throttle.limit', 100),
        },
      ],
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    CatalogModule,
    CustomerModule,
    TechnicianModule,
    BookingModule,
    PaymentModule,
    NotificationModule,
    UsersModule,
    AdminModule,
    ReportingModule,
  ],
  providers: [
    // Global exception filter
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },

    // Global response wrapper
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },

    // Global request logging
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },

    // Global JWT auth guard (use @Public() to skip)
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Global roles guard (use @Roles() to restrict)
    { provide: APP_GUARD, useClass: RolesGuard },

    // Global rate limiting
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
