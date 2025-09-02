import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 회원가입
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // 로그인
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 현재 로그인한 사용자 정보 조회 (보호된 라우트)
  @Get('profile')
  @UseGuards(JwtAuthGuard) // ← 여기서 검증 시작!
  /* @UseGuards(JwtAuthGuard)
   → JwtAuthGuard.canActivate()
   → super.canActivate() (AuthGuard('jwt')의 canActivate)
   → createPassportContext()
   → passport.authenticate('jwt')
   → passport-jwt Strategy.authenticate()
   → ExtractJwt.fromAuthHeaderAsBearerToken() (토큰 추출)
   → jsonwebtoken.verify() (토큰 검증)
   → JwtStrategy.validate() (우리가 만든 메서드)
   → AuthService.findUserByPayload() (우리가 만든 메서드)
   → User 객체 반환
   → request.user = user 설정
   → Guard 통과 (true 반환)
   → Controller 실행
   * */
  getProfile(@Req() req) {
    return {
      message: '인증된 사용자 정보',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      user: req.user, // JwtStrategy에서 validate 후 저장된 사용자 정보
    };
  }
}
