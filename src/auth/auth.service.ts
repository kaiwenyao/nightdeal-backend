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
    if (encryptionKeyStr.length < 32) {
      this.logger.warn(
        `SESSION_ENCRYPTION_KEY is ${encryptionKeyStr.length} chars (minimum 32). `
        +
        'Key will be padded, which reduces encryption strength. '
        +
        'Please update your environment configuration.',
      );
    }
    this.encryptionKey = Buffer.from(encryptionKeyStr.padEnd(32, '0').slice(0, 32), 'utf8');
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

  private async code2Session(code: string): Promise<{ openid: string; session_key: string }> {
    const appId = this.config.get<string>('WX_APPID');
    const secret = this.config.get<string>('WX_SECRET');
    if (!appId || !secret || secret.includes('placeholder')) {
      throw new UnauthorizedException('服务端未配置有效微信密钥，请检查 WX_APPID/WX_SECRET');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;

    const timeoutMs = this.config.get<number>('WX_LOGIN_TIMEOUT_MS') || 8000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let data: WeChatSessionResponse;
    try {
      const resp = await fetch(url, { signal: controller.signal });
      data = (await resp.json()) as WeChatSessionResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('微信登录请求超时，请稍后重试');
      }
      throw new ServiceUnavailableException('微信登录服务暂不可用，请稍后重试');
    } finally {
      clearTimeout(timeout);
    }

    if (data.errcode) {
      this.logger.warn(`WeChat login failed: errcode=${data.errcode}, errmsg=${data.errmsg}`);
      throw new WeChatApiException('微信登录失败，请重试');
    }

    return { openid: data.openid, session_key: data.session_key };
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId }, { algorithm: 'HS256' });
  }
}
