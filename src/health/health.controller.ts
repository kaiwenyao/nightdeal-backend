import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: '健康检查', description: '检查数据库和 Redis 连接状态' })
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        redis: 'ok',
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      checks.services.database = 'error';
      checks.status = 'error';
    }

    try {
      await this.redis.ping();
    } catch (error) {
      checks.services.redis = 'error';
      checks.status = 'error';
    }

    return checks;
  }
}
