import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { IsNotEmpty, ValidateIf } from 'class-validator';

@Controller('users') // /users 경로로 라우팅
export class UsersController {
  // 의존성 주입: UsersService를 자동으로 주입받음
  constructor(private readonly usersService: UsersService) {}

  // GET /users - 모든 사용자 조회
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // GET /users/:id - 특정 사용자 조회
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return user;
  }

  // POST /users - 새 사용자 생성
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  // PUT /users/:id - 사용자 정보 수정
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o: any) => !o.name && !o.email && !o.age)
  @IsNotEmpty({ message: '수정할 데이터가 없습니다.' })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return updatedUser;
  }

  // DELETE /users/:id - 사용자 삭제
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const success = await this.usersService.remove(id);
    if (!success) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return { message: `사용자 ID ${id}가 성공적으로 삭제되었습니다.` };
  }
}
