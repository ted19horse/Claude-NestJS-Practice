import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer 토큰에서 추출
      ignoreExpiration: false, // 만료된 토큰 거부
      secretOrKey: 'your-super-secret-jwt-key', // JWT 시크릿 (auth.module.ts와 동일)
    });
  }

  // JWT 토큰이 유효할 때 자동 호출
  // jwt.strategy.ts에 로그 추가
  async validate(payload: JwtPayload) {
    console.log('🎯 JwtStrategy.validate() 호출됨');
    console.log('📦 받은 payload:', payload);

    const user = await this.authService.findUserByPayload(payload);

    console.log('👤 조회된 사용자:', user);
    console.log('✅ req.user로 설정될 값:', user);

    return user;
  }
}
