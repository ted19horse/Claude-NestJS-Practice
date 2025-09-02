import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 모든 게시글 조회 (작성자 정보 포함)
  async findAll(): Promise<Post[]> {
    return await this.postRepository.find({
      relations: ['user'], // 작성자 정보도 함께 로드
      order: {
        createdAt: 'desc', // 최신순 정렬
      },
    });
  }

  // 특정 게시글 조회
  async findOne(id: number): Promise<Post | null> {
    return this.postRepository.findOne({
      where: { id },
      relations: ['user'], // 작성자 정보도 함께 로드
    });
  }

  // 특정 사용자의 게시글 조회
  async findByUserId(userId: number): Promise<Post[]> {
    return this.postRepository.find({
      where: { userId },
      relations: ['user'],
      order: {
        createdAt: 'desc',
      },
    });
  }

  // 게시글 생성
  async create(createPostDto: CreatePostDto): Promise<Post> {
    // 사용자 존재 확인
    const user = await this.userRepository.findOneBy({
      id: createPostDto.userId,
    });
    if (!user) {
      throw new BadRequestException(
        `사용자 ID ${createPostDto.userId}가 존재하지 않습니다.`,
      );
    }

    // 게시글 생성
    const post = this.postRepository.create(createPostDto);
    const savedPost = await this.postRepository.save(post);

    // 저장된 게시글을 작성자 정보와 함께 반환
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.findOne(savedPost.id);
  }

  // 게시글 수정
  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post | null> {
    // 게시글 존재 확인
    const post = await this.findOne(id);
    if (!post) {
      return null;
    }

    // 게시글 업데이트
    await this.postRepository.update(id, updatePostDto);

    // 업데이트된 게시글 반환
    return this.findOne(id);
  }

  // 게시글 삭제
  async remove(id: number): Promise<boolean> {
    const result = await this.postRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
