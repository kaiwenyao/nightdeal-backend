import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  async login(code: string): Promise<{ token: string; user: any }> {
    // 桩实现：用 code 生成伪 openId（实际应调用微信 API）
    const openid = `mock_openid_${code}`;

    // 查找或创建用户
    const user = await this.prisma.user.upsert({
      where: { openId: openid },
      create: { openId: openid },
      update: {},
    });

    // 生成 JWT
    const token = this.generateToken(user.id);

    // 存入 Redis (TTL 2h)
    await this.redis.set(
      `session:${user.id}`,
      JSON.stringify({ userId: user.id }),
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

  async verifyToken(token: string): Promise<string | null> {
    try {
      const payload = this.jwtService.verify(token);
      // 检查 Redis session 是否存在
      const session = await this.redis.get(`session:${payload.sub}`);
      if (!session) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
