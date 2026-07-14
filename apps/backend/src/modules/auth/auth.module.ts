import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import type { AppConfigValues } from '../../common/config/app.config';
import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService<AppConfigValues>) => {
        const accessExpiration = configService.getOrThrow('jwt.accessExpiration', { infer: true });

        return {
          secret: configService.getOrThrow('jwt.accessSecret', { infer: true }),
          signOptions: {
            expiresIn: accessExpiration as JwtSignOptions['expiresIn'],
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, AuthRepository, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
