import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface WeChatSessionResponse {
  openid: string;
  session_key: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class AuthService {
  private readonly encryptionKey: Buffer;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {
    const secret = this.config.get<string>('JWT_SECRET') || 'default-secret-key';
    this.encryptionKey = Buffer.from(secret.padEnd(32, '0').slice(0, 32));
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
        ...(data.nickName && { nickName: data.nickName }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
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
      const payload = this.jwtService.verify(token);
      const session = await this.redis.get(`session:${payload.sub}`);
      if (!session) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private async code2Session(code: string): Promise<{ openid: string; session_key: string }> {
    const appId = this.config.get<string>('WX_APPID');
    const secret = this.config.get<string>('WX_SECRET');
    if (!appId || !secret || secret.includes('placeholder')) {
      throw new UnauthorizedException('服务端未配置有效微信密钥，请检查 WX_APPID/WX_SECRET');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let data: WeChatSessionResponse;
    try {
      const resp = await fetch(url, { signal: controller.signal });
      data = (await resp.json()) as WeChatSessionResponse;
    } catch {
      throw new UnauthorizedException('微信登录请求超时，请稍后重试');
    } finally {
      clearTimeout(timeout);
    }

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }

    return { openid: data.openid, session_key: data.session_key };
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
