import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: any;

  constructor() {
    this.initPrisma();
  }

  private async initPrisma() {
    const { PrismaClient } = await dynamicImport('../../../prisma/generated/prisma/client.js');
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    if (this.prisma) {
      await this.prisma.$connect();
    }
  }

  async onModuleDestroy() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.prisma) {
        await this.prisma.$queryRaw`SELECT 1`;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  get user() { return this.prisma?.user; }
  get room() { return this.prisma?.room; }
  get roomPlayer() { return this.prisma?.roomPlayer; }
  get gameRecord() { return this.prisma?.gameRecord; }
  get $transaction() { return this.prisma?.$transaction.bind(this.prisma); }
  get $queryRaw() { return this.prisma?.$queryRaw.bind(this.prisma); }
}
