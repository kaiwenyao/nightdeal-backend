/**
 * 阿瓦隆游戏模块
 */

import { Module } from '@nestjs/common';
import { AvalonService } from './avalon.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [AvalonService],
  exports: [AvalonService],
})
export class AvalonModule {}
