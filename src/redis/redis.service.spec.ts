import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisModule } from './redis.module';
import { RedisService } from './redis.service';

// Mock ioredis so RedisService can be constructed and exercised without a
// real Redis server. The mock client instance is swapped in beforeEach; the
// `new Redis(...)` implementation closes over it lazily.
let clientMock: Record<string, jest.Mock>;
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => clientMock);
});

const RedisMock = Redis as unknown as jest.Mock;

describe('RedisService', () => {
  let service: RedisService;
  let errorLogSpy: jest.SpyInstance;

  function createService(redisUrl?: string): RedisService {
    const config = {
      get: jest.fn((key: string) => (key === 'REDIS_URL' ? redisUrl : undefined)),
    } as unknown as ConfigService;
    return new RedisService(config);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    clientMock = {
      on: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      eval: jest.fn().mockResolvedValue(1),
      del: jest.fn(),
      incr: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      expire: jest.fn(),
      multi: jest.fn(),
    };
    errorLogSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('RedisModule', () => {
    it('provides and exports RedisService as a global module', () => {
      const moduleRef = new RedisModule();
      expect(moduleRef).toBeInstanceOf(RedisModule);
      expect(RedisService).toBeDefined();
    });
  });

  describe('constructor', () => {
    it('uses the configured REDIS_URL', () => {
      createService('redis://redis-host:6380');
      expect(RedisMock).toHaveBeenCalledWith('redis://redis-host:6380', expect.any(Object));
    });

    it('falls back to localhost when REDIS_URL is not configured', () => {
      createService(undefined);
      expect(RedisMock).toHaveBeenCalledWith('redis://localhost:6379', expect.any(Object));
    });

    it('caps command retries at 3 and caps the reconnect backoff at 5s', () => {
      createService('redis://localhost:6379');
      const options = RedisMock.mock.calls[0][1] as {
        maxRetriesPerRequest: number;
        retryStrategy: (times: number) => number;
      };

      expect(options.maxRetriesPerRequest).toBe(3);
      expect(options.retryStrategy(1)).toBe(200);
      expect(options.retryStrategy(10)).toBe(2000);
      expect(options.retryStrategy(25)).toBe(5000);
      expect(options.retryStrategy(100)).toBe(5000);
    });

    it('subscribes to client errors without crashing the process', () => {
      service = createService('redis://localhost:6379');
      expect(clientMock.on).toHaveBeenCalledWith('error', expect.any(Function));

      const errorHandler = clientMock.on.mock.calls.find(
        ([event]: [string]) => event === 'error',
      )[1] as (err: Error) => void;
      expect(() => errorHandler(new Error('connection refused'))).not.toThrow();
      expect(errorLogSpy).toHaveBeenCalledWith(
        'Redis client error: connection refused',
      );
    });
  });

  describe('lifecycle', () => {
    it('quits the client on module destroy', async () => {
      service = createService('redis://localhost:6379');
      await service.onModuleDestroy();
      expect(clientMock.quit).toHaveBeenCalledTimes(1);
    });
  });

  describe('ping', () => {
    it('returns true for PONG', async () => {
      service = createService('redis://localhost:6379');
      clientMock.ping.mockResolvedValue('PONG');
      await expect(service.ping()).resolves.toBe(true);
    });

    it('returns false for an unexpected reply', async () => {
      service = createService('redis://localhost:6379');
      clientMock.ping.mockResolvedValue('NOT-PONG');
      await expect(service.ping()).resolves.toBe(false);
    });

    it('returns false when the ping command fails', async () => {
      service = createService('redis://localhost:6379');
      clientMock.ping.mockRejectedValue(new Error('down'));
      await expect(service.ping()).resolves.toBe(false);
    });
  });

  describe('basic commands', () => {
    it('delegates get', async () => {
      service = createService('redis://localhost:6379');
      clientMock.get.mockResolvedValue('v1');
      await expect(service.get('key')).resolves.toBe('v1');
      expect(clientMock.get).toHaveBeenCalledWith('key');
    });

    it('sets with EX when expirySeconds is provided', async () => {
      service = createService('redis://localhost:6379');
      await service.set('key', 'v', 60);
      expect(clientMock.set).toHaveBeenCalledWith('key', 'v', 'EX', 60);
    });

    it('sets without expiry when expirySeconds is missing or zero', async () => {
      service = createService('redis://localhost:6379');
      await service.set('key', 'v');
      expect(clientMock.set).toHaveBeenCalledWith('key', 'v');

      await service.set('key2', 'v2', 0);
      expect(clientMock.set).toHaveBeenCalledWith('key2', 'v2');
    });

    it('delegates del, incr, hset, hget and expire', async () => {
      service = createService('redis://localhost:6379');
      clientMock.incr.mockResolvedValue(3);
      clientMock.hget.mockResolvedValue('hv');

      await service.del('k');
      expect(clientMock.del).toHaveBeenCalledWith('k');

      await expect(service.incr('counter')).resolves.toBe(3);
      expect(clientMock.incr).toHaveBeenCalledWith('counter');

      await service.hset('h', 'f', 'v');
      expect(clientMock.hset).toHaveBeenCalledWith('h', 'f', 'v');

      await expect(service.hget('h', 'f')).resolves.toBe('hv');
      expect(clientMock.hget).toHaveBeenCalledWith('h', 'f');

      await service.expire('h', 120);
      expect(clientMock.expire).toHaveBeenCalledWith('h', 120);
    });

    it('runs hset + expire atomically through a pipeline', async () => {
      service = createService('redis://localhost:6379');
      const exec = jest.fn().mockResolvedValue([[null, 1], [null, 1]]);
      const chain = {
        hset: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec,
      };
      clientMock.multi.mockReturnValue(chain);

      await service.hsetWithExpire('h', 'f', 'v', 30);

      expect(clientMock.multi).toHaveBeenCalledTimes(1);
      expect(chain.hset).toHaveBeenCalledWith('h', 'f', 'v');
      expect(chain.expire).toHaveBeenCalledWith('h', 30);
      expect(exec).toHaveBeenCalledTimes(1);
    });

    it('returns the numeric count from incrWithExpireIfFirst', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce('5');

      await expect(service.incrWithExpireIfFirst('rate:key', 60)).resolves.toBe(5);
      expect(clientMock.eval).toHaveBeenCalledWith(
        expect.stringContaining("redis.call('incr', KEYS[1])"),
        1,
        'rate:key',
        60,
      );
    });
  });

  describe('withLock', () => {
    let setTimeoutSpy: jest.SpyInstance;
    let setIntervalSpy: jest.SpyInstance;
    let clearIntervalSpy: jest.SpyInstance;
    const unref = jest.fn();

    beforeEach(() => {
      // Execute sleeps immediately and capture interval callbacks so lock
      // renewal can be triggered deterministically without real timers.
      setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation(((cb: (...args: unknown[]) => void) => {
          cb();
          return 0;
        }) as unknown as typeof setTimeout);
      setIntervalSpy = jest
        .spyOn(global, 'setInterval')
        .mockImplementation((() => ({ unref })) as unknown as typeof setInterval);
      clearIntervalSpy = jest
        .spyOn(global, 'clearInterval')
        .mockImplementation((() => undefined) as unknown as typeof clearInterval);
    });

    afterEach(() => {
      setTimeoutSpy.mockRestore();
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });

    it('acquires on the first attempt, runs the callback and releases with the Lua script', async () => {
      service = createService('redis://localhost:6379');
      clientMock.set.mockResolvedValue('OK');
      const releaseEval = jest.fn();
      clientMock.eval.mockImplementation(async (...args: unknown[]) => {
        releaseEval(...args);
        return 1;
      });

      const result = await service.withLock('lock:key', 3000, async (lease) => {
        expect(lease.key).toBe('lock:key');
        expect(typeof lease.token).toBe('string');
        return 'done';
      });

      expect(result).toBe('done');
      expect(clientMock.set).toHaveBeenCalledWith(
        'lock:key',
        expect.any(String),
        'PX',
        3000,
        'NX',
      );
      expect(clientMock.set).toHaveBeenCalledTimes(1);
      expect(releaseEval).toHaveBeenCalledWith(
        expect.stringContaining("redis.call('del', KEYS[1])"),
        1,
        'lock:key',
        expect.any(String),
      );
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('retries with a short sleep when the lock is held, then acquires', async () => {
      service = createService('redis://localhost:6379');
      clientMock.set
        .mockResolvedValueOnce(null)
        .mockResolvedValue('OK');

      const result = await service.withLock('lock:key', 3000, async () => 'ok');

      expect(result).toBe('ok');
      expect(clientMock.set).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);
    });

    it('throws LOCK_BUSY after 40 failed attempts without running the callback', async () => {
      service = createService('redis://localhost:6379');
      clientMock.set.mockResolvedValue(null);
      const fn = jest.fn();

      await expect(
        service.withLock('lock:key', 1000, fn),
      ).rejects.toThrow('LOCK_BUSY');

      expect(clientMock.set).toHaveBeenCalledTimes(40);
      expect(fn).not.toHaveBeenCalled();
      expect(clearIntervalSpy).not.toHaveBeenCalled();
    });

    it('renews the lock TTL while the callback is still running', async () => {
      service = createService('redis://localhost:6379');
      clientMock.set.mockResolvedValue('OK');
      const renewEval = jest.fn().mockResolvedValue(1);
      const releaseEval = jest.fn().mockResolvedValue(1);
      clientMock.eval.mockImplementation(async (script: string, ...rest: unknown[]) => {
        if (String(script).includes('pexpire')) {
          return renewEval(script, ...rest);
        }
        return releaseEval(script, ...rest);
      });

      await service.withLock('lock:key', 3000, async () => {
        // Fire the renewal interval that was registered when the lock was taken.
        expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
        const renewCallback = setIntervalSpy.mock.calls[0][0] as () => void;
        renewCallback();
        await Promise.resolve();
        expect(renewEval).toHaveBeenCalledWith(
          expect.stringContaining('pexpire'),
          1,
          'lock:key',
          expect.any(String),
          3000,
        );
        return 'ran';
      });

      expect(releaseEval).toHaveBeenCalledTimes(1);
    });

    it('uses ttl/3 as the renewal interval for long TTLs', async () => {
      service = createService('redis://localhost:6379');
      clientMock.set.mockResolvedValue('OK');

      await service.withLock('lock:key', 6000, async () => 'ok');

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
    });

    it('logs but survives a failed lock renewal', async () => {
      service = createService('redis://localhost:6379');
      clientMock.set.mockResolvedValue('OK');
      clientMock.eval
        .mockRejectedValueOnce(new Error('renew failed'))
        .mockResolvedValueOnce(1);

      const result = await service.withLock('lock:key', 3000, async () => {
        const renewCallback = setIntervalSpy.mock.calls[0][0] as () => void;
        renewCallback();
        await Promise.resolve();
        return 'ran';
      });

      expect(result).toBe('ran');
      expect(errorLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to renew lock lock:key'),
      );
    });

    it('logs but still returns the callback result when the release script fails', async () => {
      service = createService('redis://localhost:6379');
      clientMock.set.mockResolvedValue('OK');
      clientMock.eval.mockRejectedValue(new Error('release failed'));

      const result = await service.withLock('lock:key', 3000, async () => 'kept');

      expect(result).toBe('kept');
      expect(errorLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to release lock lock:key'),
      );
    });

    it('releases the lock even when the callback throws', async () => {
      service = createService('redis://localhost:6379');
      clientMock.set.mockResolvedValue('OK');
      clientMock.eval.mockResolvedValue(1);

      await expect(
        service.withLock('lock:key', 3000, async () => {
          throw new Error('callback boom');
        }),
      ).rejects.toThrow('callback boom');

      expect(clientMock.eval).toHaveBeenCalledWith(
        expect.stringContaining("redis.call('del', KEYS[1])"),
        1,
        'lock:key',
        expect.any(String),
      );
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('setWithLock', () => {
    it('writes the value while the lease is owned', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce(1);

      await service.setWithLock(
        { key: 'lock:key', token: 'token-1' },
        'state:key',
        'payload',
        120,
      );

      expect(clientMock.eval).toHaveBeenCalledWith(
        expect.stringContaining("redis.call('set', KEYS[2], ARGV[2], 'EX', ARGV[3])"),
        2,
        'lock:key',
        'state:key',
        'token-1',
        'payload',
        120,
      );
    });

    it('passes 0 as the TTL argument when no expiry is requested', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce('1');

      await service.setWithLock(
        { key: 'lock:key', token: 'token-1' },
        'state:key',
        'payload',
      );

      expect(clientMock.eval).toHaveBeenCalledWith(
        expect.anything(),
        2,
        'lock:key',
        'state:key',
        'token-1',
        'payload',
        0,
      );
    });

    it('throws LOCK_LOST when the lease was lost', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce(0);

      await expect(
        service.setWithLock({ key: 'lock:key', token: 'stale' }, 'state:key', 'payload'),
      ).rejects.toThrow('LOCK_LOST');
    });
  });

  describe('delWithLock', () => {
    it('deletes the key while the lease is owned', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce(1);

      await service.delWithLock({ key: 'lock:key', token: 'token-1' }, 'state:key');

      expect(clientMock.eval).toHaveBeenCalledWith(
        expect.stringContaining("redis.call('del', KEYS[2])"),
        2,
        'lock:key',
        'state:key',
        'token-1',
      );
    });

    it('does not throw when the key was already gone (0 deleted)', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce(0);

      await expect(
        service.delWithLock({ key: 'lock:key', token: 'token-1' }, 'state:key'),
      ).resolves.toBeUndefined();
    });

    it('throws LOCK_LOST when the lease was lost (-1)', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce(-1);

      await expect(
        service.delWithLock({ key: 'lock:key', token: 'stale' }, 'state:key'),
      ).rejects.toThrow('LOCK_LOST');
    });
  });

  describe('delJsonFieldWithLock', () => {
    it('returns true when the matching field was deleted', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce(1);

      await expect(
        service.delJsonFieldWithLock(
          { key: 'lock:key', token: 'token-1' },
          'state:key',
          'generation',
          '3',
        ),
      ).resolves.toBe(true);
      expect(clientMock.eval).toHaveBeenCalledWith(
        expect.stringContaining('cjson.decode'),
        2,
        'lock:key',
        'state:key',
        'token-1',
        'generation',
        '3',
      );
    });

    it('returns false when the field did not match (0 deleted)', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce(0);

      await expect(
        service.delJsonFieldWithLock(
          { key: 'lock:key', token: 'token-1' },
          'state:key',
          'generation',
          '3',
        ),
      ).resolves.toBe(false);
    });

    it('throws LOCK_LOST when the lease was lost (-1)', async () => {
      service = createService('redis://localhost:6379');
      clientMock.eval.mockResolvedValueOnce(-1);

      await expect(
        service.delJsonFieldWithLock(
          { key: 'lock:key', token: 'stale' },
          'state:key',
          'generation',
          '3',
        ),
      ).rejects.toThrow('LOCK_LOST');
    });
  });
});
