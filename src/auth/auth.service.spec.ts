import { BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WeChatApiException } from '../common/exceptions/wechat-api.exception';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { upsert: jest.Mock; update: jest.Mock } };
  let redis: { set: jest.Mock; get: jest.Mock; expire: jest.Mock };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let fetchSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    prisma = {
      user: {
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };
    redis = {
      set: jest.fn(),
      get: jest.fn(),
      expire: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const values: Record<string, string | number> = {
      WX_APPID: 'wx-app-id',
      WX_SECRET: 'wx-secret',
      WX_LOGIN_TIMEOUT_MS: 8000,
      AVATAR_URL_PREFIX: 'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/',
    };
    const config = {
      get: jest.fn((key: string) => values[key]),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
      config as unknown as ConfigService,
      jwtService as unknown as JwtService,
    );
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    jest.restoreAllMocks();
  });

  function mockWeChatResponse(body: unknown) {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => body,
    } as Response);
  }

  it('rejects a WeChat response without openid', async () => {
    mockWeChatResponse({ session_key: 'session-key' });

    await expect(service.login('wx-code')).rejects.toBeInstanceOf(WeChatApiException);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('rejects a WeChat response without session_key', async () => {
    mockWeChatResponse({ openid: 'open-id' });

    await expect(service.login('wx-code')).rejects.toBeInstanceOf(WeChatApiException);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it.each([
    ['null response', null],
    ['empty openid', { openid: '', session_key: 'session-key' }],
    ['non-string openid', { openid: {}, session_key: 'session-key' }],
    ['empty session_key', { openid: 'open-id', session_key: '' }],
    ['non-string session_key', { openid: 'open-id', session_key: [] }],
  ])('rejects a WeChat response with %s', async (_case, body) => {
    mockWeChatResponse(body);

    await expect(service.login('wx-code')).rejects.toBeInstanceOf(WeChatApiException);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  describe('login session storage', () => {
    it('stores the session with TTL and does not persist the WeChat session_key', async () => {
      mockWeChatResponse({ openid: 'open-id', session_key: 'sensitive-session-key' });
      prisma.user.upsert.mockResolvedValue({ id: 'user-id', nickName: null, avatarUrl: null });
      jwtService.sign.mockReturnValue('jwt-token');

      await service.login('wx-code');

      expect(redis.set).toHaveBeenCalledWith(
        'session:user-id',
        expect.any(String),
        7200,
      );
      const stored = redis.set.mock.calls[0][1] as string;
      expect(JSON.parse(stored)).toEqual({ userId: 'user-id' });
      expect(stored).not.toContain('sensitive-session-key');
    });
  });

  describe('verifyToken sliding renewal', () => {
    it('returns the user id and renews the session TTL on a valid token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-id' });
      redis.get.mockResolvedValue(JSON.stringify({ userId: 'user-id' }));

      const result = await service.verifyToken('valid-token');

      expect(result).toBe('user-id');
      expect(redis.expire).toHaveBeenCalledWith('session:user-id', 7200);
    });

    it('returns null without renewing when the session is missing', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-id' });
      redis.get.mockResolvedValue(null);

      const result = await service.verifyToken('valid-token');

      expect(result).toBeNull();
      expect(redis.expire).not.toHaveBeenCalled();
    });

    it('returns null for an invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      const result = await service.verifyToken('bad-token');

      expect(result).toBeNull();
      expect(redis.expire).not.toHaveBeenCalled();
    });

    it('still returns the user id when TTL renewal fails', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-id' });
      redis.get.mockResolvedValue(JSON.stringify({ userId: 'user-id' }));
      redis.expire.mockRejectedValueOnce(new Error('redis down'));

      const result = await service.verifyToken('valid-token');

      expect(result).toBe('user-id');
    });
  });

  describe('updateProfile avatarUrl validation', () => {
    it('accepts an avatarUrl under the configured OSS prefix', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'user-id',
        nickName: '小明',
        avatarUrl: 'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/user-id/1.jpg',
      });

      const result = await service.updateProfile('user-id', {
        avatarUrl: 'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/user-id/1.jpg',
      });

      expect(result.avatarUrl).toBe(
        'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/user-id/1.jpg',
      );
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('rejects an avatarUrl pointing to an external host', async () => {
      await expect(
        service.updateProfile('user-id', { avatarUrl: 'https://evil.example.com/x.jpg' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
