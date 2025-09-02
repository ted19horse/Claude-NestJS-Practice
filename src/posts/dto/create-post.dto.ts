import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '제목은 필수 입력 항목입니다.' })
  @Length(1, 200, { message: '제모긍ㄴ 1자 이상 200자 이하여야 합니다.' })
  title: string;

  @IsString({ message: '내용은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '내용은 필수 입력 항목입니다.' })
  content: string;

  @Type(() => Number)
  @IsNumber({}, { message: '작성자 ID는 숫자여야 합니다.' })
  @Min(1, { message: '작성자 ID는 1 이상이어야 합니다.' })
  userId: number;
}
