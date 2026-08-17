import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';

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

  /**
   * Run one short cross-instance critical section under a token-owned Redis lock.
   * The Lua release prevents an expired lock owner from deleting a newer owner's lock.
   */
  async withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const token = randomUUID();
    let acquired: 'OK' | null = null;
    for (let attempt = 0; attempt < 40 && acquired !== 'OK'; attempt++) {
      acquired = await this.client.set(key, token, 'PX', ttlMs, 'NX');
      if (acquired !== 'OK') {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    if (acquired !== 'OK') throw new Error('LOCK_BUSY');

    const renewTimer = setInterval(() => {
      void this.client.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end",
        1,
        key,
        token,
        ttlMs,
      ).catch((error) => this.logger.error(`Failed to renew lock ${key}: ${error}`));
    }, Math.max(1000, Math.floor(ttlMs / 3)));
    renewTimer.unref();

    try {
      return await fn();
    } finally {
      clearInterval(renewTimer);
      try {
        await this.client.eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          1,
          key,
          token,
        );
      } catch (error) {
        // Never mask the lifecycle operation's authoritative result. The lock
        // has a TTL and will self-release if Redis is temporarily unavailable.
        this.logger.error(`Failed to release lock ${key}: ${error}`);
      }
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
