import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import * as bcrypt from 'bcryptjs';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '사용자 이름',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true, // UNIQUE 제약조건
    comment: '이메일 주소',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '암호화된 비밀번호',
    select: false, // 기본 조회 시 비밀번호 제외
  })
  password: string;

  @Column({
    type: 'int',
    comment: '나이',
  })
  age: number;

  // 1:N 관계 - 한 사용자는 여러 게시글을 가짐
  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

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

  // 비밀번호 암호화 (저장 전 자동 실행)
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  // 비밀번호 검증 메서드
  async validatePassword(plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, this.password);
  }
}
