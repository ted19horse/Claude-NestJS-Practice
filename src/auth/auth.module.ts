import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]), // RefreshToken (Access/Refresh token에서 추가)
    PassportModule,
    JwtModule.register({
      secret: 'your-super-secret-jwt-key', // 실제로는 환경변수 사용
      signOptions: { expiresIn: '15m' }, // 토큰 만료 시간, Refresh Token 추가로 Access Token은 1시간에서 15분으로 단축
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // 다른 모듈에서 사용할 수 있도록
})
export class AuthModule {}
