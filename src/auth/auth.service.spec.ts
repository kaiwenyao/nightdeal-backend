import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WeChatApiException } from '../common/exceptions/wechat-api.exception';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { upsert: jest.Mock } };
  let redis: { set: jest.Mock; get: jest.Mock };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let fetchSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    prisma = {
      user: {
        upsert: jest.fn(),
      },
    };
    redis = {
      set: jest.fn(),
      get: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const values: Record<string, string | number> = {
      SESSION_ENCRYPTION_KEY: '12345678901234567890123456789012',
      WX_APPID: 'wx-app-id',
      WX_SECRET: 'wx-secret',
      WX_LOGIN_TIMEOUT_MS: 8000,
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
});
