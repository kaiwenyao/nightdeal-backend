/**
 * 阿瓦隆游戏模块
 */

import { Module } from '@nestjs/common';
import { AvalonService } from './avalon.service';
import { AvalonGateway } from './avalon.gateway';
import { RedisModule } from '../redis/redis.module';
import { RoomModule } from '../room/room.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RedisModule, RoomModule, AuthModule],
  providers: [AvalonService, AvalonGateway],
  exports: [AvalonService],
})
export class AvalonModule {}
