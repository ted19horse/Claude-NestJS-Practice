import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Repository 주입
  ) {}

  // 모든 사용자 조회
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // 특정 사용자 조회
  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['posts'], // 게시글 관계 데이터도 함께 로드
      order: {
        posts: {
          createdAt: 'desc', // 게시글을 최신순으로 정렬
        },
      },
    });
  }

  // 이메일로 사용자 찾기 (중복 검사용)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  // 사용자 생성
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 이메일 중복 검사
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('이미 사용중인 이메일입니다.');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  // 사용자 수정
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    // 사용자 존재 확인
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    // 이메일 중복 검사 (수정 시)
    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('이미 사용 중인 이메일입니다.');
      }
    }

    // 사용자 정보 업데이트
    await this.userRepository.update(id, updateUserDto);

    // 업데이트된 사용자 반환
    return this.findOne(id);
  }

  // 사용자 삭제
  async remove(id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
