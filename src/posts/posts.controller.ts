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
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post as PostEntity } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string): Promise<PostEntity[]> {
    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        throw new NotFoundException('유효하지 않은 사용자 ID입니다.');
      }
      return this.postsService.findByUserId(userIdNum);
    }
    return this.postsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PostEntity> {
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new NotFoundException(`게시글 ID ${id}를 찾을 수 없습니다.`);
    }
    return post;
  }

  @Post()
  async create(@Body() createPostDto: CreatePostDto): Promise<PostEntity> {
    return this.postsService.create(createPostDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    const updatedPost = await this.postsService.update(id, updatePostDto);
    if (!updatedPost) {
      throw new NotFoundException(`게시글 ID ${id}를 찾을 수 없습니다.`);
    }
    return updatedPost;
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const success = await this.postsService.remove(id);
    if (!success) {
      throw new NotFoundException(`게시글 ID ${id}를 찾을 수 없습니다.`);
    }
    return { message: `게시글 ID ${id}가 성공적으로 삭제되었습니다.` };
  }
}
