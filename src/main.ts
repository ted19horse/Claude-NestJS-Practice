import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 전역 유효성 검사 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      // 1. DTO에 정의되지 않은 속성 제거
      whitelist: true,
      // 2. 허용되지 않은 속성이 있으면 에러 발생
      forbidNonWhitelisted: true,
      // 3. 타입 변환 자동 수행 (string "123" -> number 123)
      transform: true,
      // 4. 상세한 에러 메세지 제공
      disableErrorMessages: false,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
