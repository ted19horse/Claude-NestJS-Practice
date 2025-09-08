import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '../auth.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer 토큰에서 추출
      ignoreExpiration: false, // 만료된 토큰 거부
      secretOrKey: 'your-super-secret-jwt-key', // JWT 시크릿 (auth.module.ts와 동일)
      passReqToCallback: true, // (토큰 블랙리스트에서 추가)
    });
  }

  // JWT 토큰이 유효할 때 자동 호출
  // jwt.strategy.ts에 로그 추가
  async validate(req: any, payload: JwtPayload) {
    console.log('🎯 JwtStrategy.validate() 호출됨');
    console.log('📦 받은 payload:', payload);

    // Access Token인지 확인 (Access/Refresh token에서 추가)
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Access Token이 아닙니다.');
    }

    // (토큰 블랙리스트에서 추가)
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && (await this.redisService.isTokenBlacklisted(token))) {
      throw new UnauthorizedException('무효화된 토큰입니다.');
    }

    const user = await this.authService.findUserByPayload(payload);
    console.log('👤 조회된 사용자:', user);
    console.log('✅ req.user로 설정될 값:', user);

    return user;
  }
}
