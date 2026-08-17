import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('HealthController', () => {
  it('reports Redis as unhealthy when ping resolves false', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const redis = { ping: jest.fn().mockResolvedValue(false) };
    const controller = new HealthController(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
    try {
      await controller.check();
    } catch (error) {
      const exception = error as ServiceUnavailableException;
      expect(exception.getStatus()).toBe(503);
      expect(exception.getResponse()).toMatchObject({
        status: 'error',
        services: { database: 'ok', redis: 'error' },
      });
    }
  });
});
