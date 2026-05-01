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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto, KickRoomBodyDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private roomService: RoomService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建房间', description: '创建一个新的游戏房间' })
  @UseGuards(AuthGuard)
  async createRoom(@Request() req: any, @Body() dto: CreateRoomDto) {
    const room = await this.roomService.createRoom(
      req.user.id,
      dto.roleConfig as any,
      dto.maxPlayers,
    );
    return {
      id: room.id,
      code: room.code,
      status: room.status,
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
    return result;
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
