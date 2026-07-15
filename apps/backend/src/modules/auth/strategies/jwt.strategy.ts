import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AppConfigValues } from '../../../common/config/app.config';
import { AuthenticatedUser, JwtPayload } from '../../../common/interfaces/auth.interface';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<AppConfigValues>,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt.accessSecret', { infer: true }),
      passReqToCallback: true,
    });
  }

  /**
   * Validate the JWT payload AND check if the token is blacklisted.
   * Called on every authenticated request.
   */
  async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Check if access token has been blacklisted (post-logout)
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token) {
      const isBlacklisted = await this.tokenService.isAccessTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return {
      userId: payload.sub,
      phone: payload.phone,
      role: payload.role,
    };
  }
}
