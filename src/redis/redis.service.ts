import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: 'redis://localhost:6379',
    });

    this.client.connect().catch(console.error);
  }

  // 토큰 블랙리스트에 추가 (로그아웃 시)
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.client.setEx(key, expiresInSeconds, 'blacklisted');
  }

  // 토큰이 블랙리스트에 있는지 확인
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.client.get(key);
    return result === 'blacklisted';
  }

  // 앱 종료 시 연결 해제
  async onModuleDestroy() {
    await this.client.quit();
  }
}
