import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AppConfigValues } from '../../../common/config/app.config';
import { JwtPayload } from '../../../common/interfaces/auth.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService<AppConfigValues>) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt.refreshSecret', { infer: true }),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      phone: payload.phone,
      role: payload.role,
    };
  }
}
