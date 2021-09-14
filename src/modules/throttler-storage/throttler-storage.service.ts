import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { ThrottlerStorage } from './throttler-storage.interface';

@Injectable()
export class ThrottlerStorageService implements ThrottlerStorage {
  constructor(@InjectRedis() private readonly throttlerStorageService: Redis) {}

  async getRecord(key: string): Promise<number[]> {
    const ttls = (
      await this.throttlerStorageService.scan(
        0,
        'MATCH',
        `${key}:*`,
        'COUNT',
        1000,
      )
    ).pop();
    return (ttls as string[]).map(k => parseInt(k.split(':').pop())).sort();
  }

  async addRecord(key: string, ttl: number): Promise<void> {
    await this.throttlerStorageService.set(
      `${key}:${Date.now() + ttl * 1000}`,
      ttl,
      'EX',
      ttl,
    );
  }
}
