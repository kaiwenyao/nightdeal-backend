import { BadRequestException, GatewayTimeoutException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
  // Redis 会话 TTL，verifyToken 校验成功时滑动续期到该时长；
  // JWT 自身的 expiresIn（见 auth.module.ts）才是会话硬上限
  private static readonly SESSION_TTL_SECONDS = 7200;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  async login(code: string): Promise<{ token: string; user: any }> {
    const { openid } = await this.code2Session(code);

    const user = await this.prisma.user.upsert({
      where: { openId: openid },
      create: { openId: openid },
      update: {},
    });

    const token = this.generateToken(user.id);

    // 微信 session_key 不落盘（不写入 Redis），只保留会话存在性标记
    await this.redis.set(
      `session:${user.id}`,
      JSON.stringify({ userId: user.id }),
      AuthService.SESSION_TTL_SECONDS,
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
    if (data.avatarUrl !== undefined) {
      // 头像地址必须来自本服务的 OSS，防止挂任意外链
      const avatarUrlPrefix = this.config.get<string>('AVATAR_URL_PREFIX');
      if (!avatarUrlPrefix || !data.avatarUrl.startsWith(avatarUrlPrefix)) {
        throw new BadRequestException('头像地址不合法，请先通过头像上传接口上传');
      }
    }

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
      const sessionKey = `session:${payload.sub}`;
      const session = await this.redis.get(sessionKey);
      if (!session) return null;
      // 滑动续期：校验成功就重置会话 TTL，长对局不会因 2 小时不活动被集体踢下线
      await this.redis.expire(sessionKey, AuthService.SESSION_TTL_SECONDS);
      return payload.sub;
    } catch {
      return null;
    }
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
