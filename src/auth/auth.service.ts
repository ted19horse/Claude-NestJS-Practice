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

export interface JwtPayload {
  sub: number; // 사용자 ID
  email: string; // 이메일
  iat: number; // 발급 시간
  exp: number; // 만료 시간
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // 회원가입
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

    // JWT 토큰 생성
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
    };
    /* AuthService.register()
     → NestJS JwtService.sign()
     → jsonwebtoken.sign()
     → iat, exp 자동 추가 (jsonwebtoken 내부)
     → Header.Payload.Signature 생성
     → JWT 문자열 반환
     * */
    const accessToken = this.jwtService.sign(payload);

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithPassword } = savedUser;

    return {
      message: '회원 가입이 완료되었습니다.',
      accessToken,
      user: userWithPassword,
    };
  }

  // 로그인
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

    // JWT 토큰 생성
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    const accessToken = this.jwtService.sign(payload);

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      message: '로그인이 완료되었습니다.',
      accessToken,
      user: userWithoutPassword,
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
}
