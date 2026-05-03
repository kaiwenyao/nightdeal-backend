import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Patch,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { CreateRoomDto, KickRoomBodyDto, UpdateRoomSettingsDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(
    private roomService: RoomService,
    private roomGateway: RoomGateway,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建房间', description: '创建一个新的游戏房间' })
  @UseGuards(AuthGuard)
  async createRoom(@Request() req: any, @Body() dto: CreateRoomDto) {
    const result = await this.roomService.createRoom(
      req.user.id,
      dto.roleConfig,
      dto.maxPlayers,
      dto.gameType,
    );
    if ('error' in result) {
      throw new BadRequestException(result.error);
    }
    const room = result;
    return {
      id: room.id,
      code: room.code,
      status: room.status,
      gameType: room.gameType,
      roleConfig: room.roleConfig,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
    };
  }

  @Post(':code/join')
  @ApiBearerAuth()
  @ApiOperation({ summary: '加入房间', description: '通过房间码加入房间' })
  @UseGuards(AuthGuard)
  async joinRoom(@Request() req: any, @Param('code') raw: string) {
    const code = raw.toUpperCase();
    const result = await this.roomService.joinRoom(code, req.user.id);
    if ('error' in result) {
      throw new BadRequestException(result.error);
    }
    return this.buildRoomDetail(code);
  }

  @Post(':code/leave')
  @ApiBearerAuth()
  @ApiOperation({ summary: '离开房间', description: '当前用户离开指定房间' })
  @UseGuards(AuthGuard)
  async leaveRoom(@Request() req: any, @Param('code') raw: string) {
    const code = raw.toUpperCase();
    const room = await this.roomService.getRoom(code);
    if (!room) {
      throw new NotFoundException('房间不存在');
    }
    const player = await this.roomService.getPlayer(code, req.user.id);
    if (!player) {
      throw new BadRequestException('你不在该房间中');
    }
    await this.roomService.leaveRoom(code, req.user.id);
    this.roomGateway.evictUserFromRoom(req.user.id, code);

    // Emit player-left event to all remaining clients in the room (consistent with WebSocket leave)
    const playerCount = await this.roomService.getPlayerCount(code);
    this.roomGateway.server.to(code).emit('room:player-left', {
      userId: req.user.id,
      playerCount,
    });

    await this.roomGateway.broadcastRoomState(code);
    return { success: true };
  }

  @Post(':code/start')
  @ApiBearerAuth()
  @ApiOperation({ summary: '开始游戏', description: '房主开始本局游戏' })
  @UseGuards(AuthGuard)
  async startGame(@Request() req: any, @Param('code') raw: string) {
    const code = raw.toUpperCase();
    const result = await this.roomService.startGame(code, req.user.id);
    if ('error' in result) {
      throw new BadRequestException(result.error);
    }
    return result;
  }

  @Post(':code/restart')
  @ApiBearerAuth()
  @ApiOperation({ summary: '重开游戏', description: '房主重新发牌，房间不解散' })
  @UseGuards(AuthGuard)
  async restartGame(@Request() req: any, @Param('code') raw: string) {
    const code = raw.toUpperCase();
    const result = await this.roomService.restartGame(code, req.user.id);
    if ('error' in result) {
      throw new BadRequestException(result.error);
    }
    await this.roomGateway.notifyClientsAfterRestart(code, result.assignments);
    return result;
  }

  @Post(':code/kick')
  @ApiBearerAuth()
  @ApiOperation({ summary: '踢出玩家', description: '房主将玩家移出房间' })
  @UseGuards(AuthGuard)
  async kickPlayer(@Request() req: any, @Param('code') raw: string, @Body() body: KickRoomBodyDto) {
    const code = raw.toUpperCase();
    const result = await this.roomService.kickPlayer(code, req.user.id, body.userId);
    if ('error' in result) {
      throw new BadRequestException(result.error);
    }
    await this.roomGateway.notifyClientsAfterKick(code, body.userId);
    return result;
  }

  @Patch(':code/settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新房间设置', description: '房主更新房间人数和角色配置' })
  @UseGuards(AuthGuard)
  async updateRoomSettings(@Request() req: any, @Param('code') raw: string, @Body() dto: UpdateRoomSettingsDto) {
    return this.applyRoomSettingsUpdate(req, raw, dto);
  }

  @Put(':code/settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新房间设置', description: '房主更新房间人数和角色配置' })
  @UseGuards(AuthGuard)
  async putRoomSettings(@Request() req: any, @Param('code') raw: string, @Body() dto: UpdateRoomSettingsDto) {
    return this.applyRoomSettingsUpdate(req, raw, dto);
  }

  private async applyRoomSettingsUpdate(req: any, raw: string, dto: UpdateRoomSettingsDto) {
    const code = raw.toUpperCase();
    const result = await this.roomService.updateRoomSettings(code, req.user.id, {
      maxPlayers: dto.maxPlayers,
      roleConfig: dto.roleConfig,
    });
    if ('error' in result) {
      const err = (result as { error: string }).error;
      if (err === '房间不存在') throw new NotFoundException(err);
      if (err === '仅房主可以修改设置') throw new ForbiddenException(err);
      throw new BadRequestException(err);
    }
    // Broadcast to WebSocket clients in the room so they see the update immediately
    await this.roomGateway.broadcastRoomState(code);
    return this.buildRoomDetail(code);
  }

  @Get(':code/my-role')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的角色', description: '获取当前用户在指定房间中的角色' })
  @UseGuards(AuthGuard)
  async getMyRole(@Request() req: any, @Param('code') raw: string) {
    const code = raw.toUpperCase();
    const room = await this.roomService.getRoom(code);
    if (!room) {
      throw new NotFoundException('房间不存在');
    }
    if (room.status !== 'PLAYING') {
      throw new ForbiddenException('游戏尚未开始');
    }

    const player = await this.roomService.getPlayer(code, req.user.id);
    if (!player) {
      throw new ForbiddenException('你不在该房间中');
    }

    return {
      role: player.role,
      seatNo: player.seatNo,
    };
  }

  @Get(':code')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取房间信息', description: '根据房间码获取房间详细信息' })
  @UseGuards(AuthGuard)
  async getRoom(@Param('code') raw: string) {
    return this.buildRoomDetail(raw.toUpperCase());
  }

  private async buildRoomDetail(code: string) {
    const room = await this.roomService.getRoom(code);
    if (!room) {
      throw new NotFoundException('房间不存在');
    }

    const players = await this.roomService.getPlayers(code);
    const host = players.find((p) => p.userId === room.hostId);

    return {
      id: room.id,
      code: room.code,
      status: room.status,
      gameType: room.gameType,
      roleConfig: room.roleConfig,
      maxPlayers: room.maxPlayers,
      host: host
        ? {
            id: host.user.id,
            nickName: host.user.nickName,
            avatarUrl: host.user.avatarUrl,
          }
        : null,
      players: players.map((p) => ({
        id: p.id,
        seatNo: p.seatNo,
        user: {
          id: p.user.id,
          nickName: p.user.nickName,
          avatarUrl: p.user.avatarUrl,
        },
        joinedAt: p.joinedAt ?? undefined,
      })),
      createdAt: room.createdAt,
    };
  }
}
