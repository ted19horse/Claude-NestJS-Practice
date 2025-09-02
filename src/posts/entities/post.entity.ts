import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 200,
    comment: '게시글 제목',
  })
  title: string;

  @Column({
    type: 'text',
    comment: '게시글 내용',
  })
  content: string;

  // N:1 관계 - 여러 게시글이 하나의 사용자에 속함
  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE', // 사용자 삭제 시 게시글도 함께 삭제
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'user_id',
    comment: '작성자 ID (외래키)',
  })
  userId: number;

  @CreateDateColumn({
    name: 'created_at',
    comment: '생성일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    comment: '수정일시',
  })
  updatedAt: Date;
}
