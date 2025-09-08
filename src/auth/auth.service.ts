import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { RedisService } from '../redis/redis.service';

export interface JwtPayload {
  sub: number; // 사용자 ID
  email: string; // 이메일
  type?: 'access' | 'refresh'; // 추가: 토큰 타입
  iat?: number; // 발급 시간
  exp?: number; // 만료 시간
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken) // (Access/Refresh token에서 추가)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService, // (토큰 블랙리스트에서 추가)
  ) {}

  // 회원가입
  // 기존 register 메서드를 토큰 쌍 발급으로 수정
  async register(registerDto: RegisterDto) {
    // 이메일 중복 검사
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 이메일입니다.');
    }

    // 새 사용자 생성 (비밀번호는 Entity에서 자동 암호화)
    const user = this.userRepository.create(registerDto);
    const savedUser = await this.userRepository.save(user);

    // JWT 토큰 생성 (단일 토큰 생성 방식)
    // const payload: JwtPayload = {
    //   sub: savedUser.id,
    //   email: savedUser.email,
    // };

    /* AuthService.register()
     → NestJS JwtService.sign()
     → jsonwebtoken.sign()
     → iat, exp 자동 추가 (jsonwebtoken 내부)
     → Header.Payload.Signature 생성
     → JWT 문자열 반환
     * */
    // const accessToken = this.jwtService.sign(payload);

    // 토큰 쌍 생성 (Access/Refresh token에서 추가)
    const tokens = await this.generateTokens(savedUser);

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithPassword } = savedUser;

    return {
      message: '회원 가입이 완료되었습니다.',
      // accessToken, // 단일 토큰 생성 방식
      ...tokens, // accessToken, refreshToken 포함
      user: userWithPassword,
    };
  }

  // 로그인
  // 기존 login 메서드를 토큰 쌍 발급으로 수정
  async login(loginDto: LoginDto) {
    // 이메일로 사용자 찾기 (비밀번호 포함)
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: [
        'id',
        'name',
        'email',
        'password',
        'age',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await user.validatePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // JWT 토큰 생성 (단일 토큰 생성 방식)
    // const payload: JwtPayload = {
    //   sub: user.id,
    //   email: user.email,
    // };
    // const accessToken = this.jwtService.sign(payload);

    // 토큰 쌍 생성 (Access/Refresh token에서 추가)
    const tokens = await this.generateTokens(user);

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      message: '로그인이 완료되었습니다.',
      // accessToken, // 단일 토큰 생성 방식
      ...tokens, // accessToken, refreshToken 포함
      user: userWithoutPassword,
    };
  }

  // 토큰 쌍 생성 메서드 (Access/Refresh token에서 추가)
  private async generateTokens(user: User) {
    // Access Token (15분)
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
    });

    // Refresh Token (7일)
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    });

    // Refresh Token DB에 저장
    await this.saveRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Refresh Token 저장 (Access/Refresh token에서 추가)
  private async saveRefreshToken(token: string, userId: number) {
    // 기존 토큰들 삭제 (간단하게 1개만 유지)
    await this.refreshTokenRepository.delete({ userId: userId });

    // 새 토큰 저장
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  // Refresh Token으로 새 Access Token 발급 (Access/Refresh token에서 추가)
  async refreshAccessToken(refreshToken: string) {
    // 1. Refresh Token 검증
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    // 2. 토큰 타입 확인
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh Token이 아닙니다.');
    }

    // 3. DB에서 토큰 확인
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, userId: payload.sub },
    });

    if (!storedToken) {
      throw new UnauthorizedException('토큰을 찾을 수 없습니다.');
    }

    // 4. 만료 확인
    if (storedToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.delete({ id: storedToken.id });
      throw new UnauthorizedException('만료된 토큰입니다.');
    }

    // 5. 새 Access Token 생성
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const newAccessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    const newAccessToken = this.jwtService.sign(newAccessPayload, {
      expiresIn: '15m',
    });

    return {
      message: '토큰이 갱신되었습니다.',
      accessToken: newAccessToken,
    };
  }

  // JWT 페이로드로 사용자 찾기 (Guard에서 사용)
  async findUserByPayload(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    return user;
  }

  // 타입 안정성 보장
  private isJwtPayload(value: unknown): value is JwtPayload {
    if (!value || typeof value !== 'object') return false;

    const obj = value as Record<string, unknown>;
    return (
      typeof obj.sub === 'number' &&
      typeof obj.email === 'string' &&
      typeof obj.exp === 'number'
    );
  }

  // 로그아웃 (토큰 블랙리스트에서 추가)
  async logout(authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    const accessToken = authHeader.substring(7); // 'Bearer ' 제거

    try {
      // 토큰 검증 및 정보 추출
      const payload: unknown = this.jwtService.verify(accessToken);

      if (!this.isJwtPayload(payload)) {
        throw new UnauthorizedException('잘못된 토큰 형식입니다.');
      }

      // Access Token인지 확인
      if (payload.type && payload.type !== 'access') {
        throw new UnauthorizedException('Access Token이 아닙니다.');
      }

      // 토큰 남은 만료 시간 계산
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = payload.exp! - currentTime; // ! 사용 (exp는 JWT에서 자동 추가)

      if (remainingTime > 0) {
        // Redis 블랙리스트에 추가 (남은 시간동안 유지)
        await this.redisService.blacklistToken(accessToken, remainingTime);
      }

      // Refresh Token도 DB에서 삭제 (완전 로그아웃)
      await this.refreshTokenRepository.delete({ userId: payload.sub });

      return {
        message: '로그아웃이 완료되었습니다.',
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
