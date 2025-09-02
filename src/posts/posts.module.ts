import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from './entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User])], // Post, User 엔티티 모두 가져오기
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
