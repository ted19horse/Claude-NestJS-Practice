import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsOptional()
  title?: string;

  @IsOptional()
  content?: string;

  // userId는 수정 불가하므로 제외

  // 빈 객체 검증
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o: any) => !o.title && !o.content)
  @IsNotEmpty({ message: '수정할 데이터가 없습니다.' })
  _?: never;
}
