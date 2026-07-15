import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AppConfigValues } from '../../../common/config/app.config';
import { AuthenticatedUser, JwtPayload } from '../../../common/interfaces/auth.interface';

/**
 * JwtRefreshStrategy — used ONLY for the /auth/refresh endpoint.
 * Extracts the JWT from the request body's 'refreshToken' field.
 *
 * NOTE: This is a SECONDARY validation. The primary refresh token
 * validation (opaque token lookup, replay detection) happens in
 * TokenService.refreshTokens(). This strategy is NOT currently
 * used because refresh tokens are opaque, not JWTs.
 * Kept for future use if refresh tokens are switched to JWT format.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService<AppConfigValues>) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt.refreshSecret', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      userId: payload.sub,
      phone: payload.phone,
      role: payload.role,
    };
  }
}
