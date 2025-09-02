import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // super.canActivate는 부모 클래스의 canActivate를 호출
    // 부모 클래스 = AuthGuard('jwt')가 반환한 동적 생성 클래스
    // JWT 토큰 검증을 passport-jwt에 위임
    return super.canActivate(context);
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //     이 호출이 전체 검증 과정을 시작함
  }
}
