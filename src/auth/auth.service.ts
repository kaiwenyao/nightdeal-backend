import { GatewayTimeoutException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createCipheriv, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WeChatApiException } from '../common/exceptions/wechat-api.exception';

interface WeChatSessionResponse {
  openid: string;
  session_key: string;
  errcode?: number;
  errmsg?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class AuthService {
  private readonly encryptionKey: Buffer;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {
    const encryptionKeyStr = this.config.get<string>('SESSION_ENCRYPTION_KEY');
    if (!encryptionKeyStr) {
      throw new Error('SESSION_ENCRYPTION_KEY is required. Set it in environment variables.');
    }
    // config.module.ts validates SESSION_ENCRYPTION_KEY as >= 32 chars via Joi at
    // startup, so the key is guaranteed long enough here. AES-256-GCM requires a
    // 32-byte key; take the first 32 bytes of the UTF-8 encoding. The guard below
    // fails fast with a clear message instead of letting createCipheriv throw an
    // opaque "Invalid key length" error.
    const keyBytes = Buffer.from(encryptionKeyStr, 'utf8');
    if (keyBytes.length < 32) {
      throw new Error('SESSION_ENCRYPTION_KEY must encode to at least 32 bytes.');
    }
    this.encryptionKey = keyBytes.subarray(0, 32);
  }

  async login(code: string): Promise<{ token: string; user: any }> {
    const { openid, session_key } = await this.code2Session(code);

    const user = await this.prisma.user.upsert({
      where: { openId: openid },
      create: { openId: openid },
      update: {},
    });

    const token = this.generateToken(user.id);

    const encryptedSessionKey = this.encrypt(session_key);
    await this.redis.set(
      `session:${user.id}`,
      JSON.stringify({ userId: user.id, sessionKey: encryptedSessionKey }),
      7200,
    );

    return {
      token,
      user: {
        id: user.id,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async updateProfile(userId: string, data: { nickName?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickName !== undefined ? { nickName: data.nickName } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
    });

    return {
      id: user.id,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
    };
  }

  async verifyToken(token: string): Promise<string | null> {
    try {
      const payload = this.jwtService.verify(token, { algorithms: ['HS256'] });
      const session = await this.redis.get(`session:${payload.sub}`);
      if (!session) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }

  private encrypt(text: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return iv.toString('hex') + ':' + encrypted + ':' + authTag;
  }

  private isInvalidWxSecret(secret: string): boolean {
    const normalized = secret.trim().toLowerCase();
    return (
      normalized.length === 0 ||
      normalized.includes('placeholder') ||
      normalized === 'your_wx_secret_here'
    );
  }

  private async code2Session(code: string): Promise<{ openid: string; session_key: string }> {
    const appId = this.config.get<string>('WX_APPID');
    const secret = this.config.get<string>('WX_SECRET');
    if (!appId || !secret || this.isInvalidWxSecret(secret)) {
      throw new UnauthorizedException('服务端未配置有效微信密钥，请检查 WX_APPID/WX_SECRET');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;

    const timeoutMs = this.config.get<number>('WX_LOGIN_TIMEOUT_MS') || 8000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let data: unknown;
    try {
      const resp = await fetch(url, { signal: controller.signal });
      data = await resp.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('微信登录请求超时，请稍后重试');
      }
      throw new ServiceUnavailableException('微信登录服务暂不可用，请稍后重试');
    } finally {
      clearTimeout(timeout);
    }

    if (!isRecord(data)) {
      this.logger.warn('WeChat login failed: invalid response shape');
      throw new WeChatApiException('微信登录失败，请重试');
    }

    if (data.errcode) {
      this.logger.warn(`WeChat login failed: errcode=${data.errcode}, errmsg=${data.errmsg}`);
      throw new WeChatApiException('微信登录失败，请重试');
    }

    if (
      typeof data.openid !== 'string'
      || data.openid.trim() === ''
      || typeof data.session_key !== 'string'
      || data.session_key.trim() === ''
    ) {
      this.logger.warn('WeChat login failed: missing openid or session_key');
      throw new WeChatApiException('微信登录失败，请重试');
    }

    return { openid: data.openid, session_key: data.session_key };
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId }, { algorithm: 'HS256' });
  }
}
