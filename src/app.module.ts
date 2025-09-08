import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module'; // (토큰 블랙리스트에서 추가)

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'nest',
      password: '1111',
      database: 'nestjs_practice',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
      timezone: '+09:00',
    }),
    UsersModule,
    PostsModule,
    AuthModule,
    RedisModule, // (토큰 블랙리스트에서 추가)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
