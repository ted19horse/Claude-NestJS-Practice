import { CreateUserDto } from './create-user.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // PartialType으로 모든 필드가 선택적이 되지만
  // 추가 검증이 필요한 경우 오버라이드 가능

  @IsOptional() // 명시적으로 선택적 필드임을 표시
  name?: string;

  @IsOptional()
  email?: string;

  @Type(() => Number)
  @IsOptional()
  age?: number;

  // 이것만 추가! (한 줄)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => !o.name && !o.email && !o.age)
  @IsNotEmpty({ message: '수정할 데이터가 없습니다.' })
  _?: never;
}
