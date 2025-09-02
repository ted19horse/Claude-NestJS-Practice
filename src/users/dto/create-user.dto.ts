import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '이름은 필수 입력 항목입니다.' })
  @Length(2, 50, { message: '이름은 2자 이상 50자 이하여야 합니다.' })
  name: string;

  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
  email: string;

  @Type(() => Number)
  @IsNumber({}, { message: '나이는 숫자여야 합니다.' })
  @Min(0, { message: '나이는 0세 이상이어야 합니다.' })
  @Max(120, { message: '나이는 120세 이하여야 합니다.' })
  age: number;

  // // 선택적 필드 예시 (비밀번호)
  // @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  // @Length(8, 20, { message: '비밀번호는 8자 이상 20자 이하여야 합니다.' })
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  //   message: '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.',
  // })
  // password?: string; // 선택적 필드
}
