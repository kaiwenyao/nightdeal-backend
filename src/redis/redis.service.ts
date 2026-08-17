import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(redisUrl, {
      // 限制单条命令的重试次数，避免 Redis 不可用时请求无限挂起
      maxRetriesPerRequest: 3,
      // 线性退避重连，每次增加 200ms，封顶 5s
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });
    // ioredis 是 EventEmitter，未监听的 'error' 事件会作为 uncaughtException 打挂进程
    this.client.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (expirySeconds) {
      await this.client.set(key, value, 'EX', expirySeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * 固定窗口计数：INCR，仅在 count===1 时设置 TTL。
   * Lua 保证原子性，避免 expire 失败留下无 TTL 的键，也不会把窗口滑成永续封禁。
   */
  async incrWithExpireIfFirst(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.eval(
      "local c = redis.call('incr', KEYS[1])\nif c == 1 then redis.call('expire', KEYS[1], ARGV[1]) end\nreturn c",
      1,
      key,
      ttlSeconds,
    );
    return Number(count);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  /**
   * HSET + 刷新 TTL。裸 hset 在键已过期后会重建一个没有 TTL 的键，
   * 之后只能等业务侧清理才会消失；用 pipeline 让写入和续期一起下发。
   */
  async hsetWithExpire(
    key: string,
    field: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client
      .multi()
      .hset(key, field, value)
      .expire(key, ttlSeconds)
      .exec();
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }
}
