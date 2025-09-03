// src/auth/dto/refresh-token.dto.ts (새로 생성)
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: '토큰은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '토큰은 필수입니다.' })
  refreshToken: string;
}
