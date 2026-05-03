import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameType, Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RoleConfig, roleConfigSchema, getDefaultConfig, PartialRoleConfig } from './role-config.schema';
import { assignRoles, RoleAssignment } from './role-assigner';
import { assignSgsRoles, SgsRoleConfig, getSgsDefaultConfig } from './sgs-role-assigner';
import { assignSeat } from './seat-assigner';
import { customAlphabet } from 'nanoid';

const generateRoomCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export interface RoomInfo {
  id: string;
  code: string;
  hostId: string;
  status: string;
  gameType: GameType;
  roleConfig: RoleConfig;
  maxPlayers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerInfo {
  id: string;
  userId: string;
  seatNo: number;
  role?: string;
  isOnline: boolean;
  joinedAt: Date;
  user: { id: string; nickName: string; avatarUrl: string };
}

export interface JoinResult {
  roomState: { room: RoomInfo; players: PlayerInfo[] };
  player: PlayerInfo;
  playerCount: number;
}

export interface StartResult {
  assignments: RoleAssignment[];
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getRoom(roomCode: string): Promise<RoomInfo | null> {
    const room = await this.prisma.room.findUnique({
      where: { code: roomCode },
    });
    if (!room) return null;
    return {
      ...room,
      gameType: room.gameType,
      roleConfig: room.roleConfig as RoleConfig,
    };
  }

  async getPlayers(roomCode: string): Promise<PlayerInfo[]> {
    const room = await this.getRoom(roomCode);
    if (!room) return [];

    const players = await this.prisma.roomPlayer.findMany({
      where: { roomId: room.id },
      include: { user: true },
      orderBy: { seatNo: 'asc' },
    });

    const result: PlayerInfo[] = [];
    for (const p of players) {
      const isOffline = await this.isPlayerOffline(roomCode, p.userId);
      result.push({
        id: p.id,
        userId: p.userId,
        seatNo: p.seatNo,
        role: p.role || undefined,
        isOnline: !isOffline,
        joinedAt: p.joinedAt ?? undefined,
        user: {
          id: p.user.id,
          nickName: p.user.nickName,
          avatarUrl: p.user.avatarUrl,
        },
      });
    }
    return result;
  }

  async getPlayerCount(roomCode: string): Promise<number> {
    const room = await this.getRoom(roomCode);
    if (!room) return 0;
    return this.prisma.roomPlayer.count({
      where: { roomId: room.id },
    });
  }

  async getPlayer(roomCode: string, userId: string): Promise<PlayerInfo | null> {
    const room = await this.getRoom(roomCode);
    if (!room) return null;

    const player = await this.prisma.roomPlayer.findFirst({
      where: { roomId: room.id, userId },
      include: { user: true },
    });
    if (!player) return null;

    const isOffline = await this.isPlayerOffline(roomCode, userId);

    return {
      id: player.id,
      userId: player.userId,
      seatNo: player.seatNo,
      role: player.role || undefined,
      isOnline: !isOffline,
      joinedAt: player.joinedAt,
      user: {
        id: player.user.id,
        nickName: player.user.nickName,
        avatarUrl: player.user.avatarUrl,
      },
    };
  }

  async createRoom(
    hostId: string,
    roleConfig?: PartialRoleConfig,
    maxPlayers?: number,
    gameType: GameType = GameType.AVALON,
  ): Promise<RoomInfo | { error: string }> {
    const resolvedMaxPlayers = maxPlayers || 5;
    const isSgs = gameType === GameType.SGS;

    let config: RoleConfig;
    if (isSgs) {
      const sgsConfig = getSgsDefaultConfig(resolvedMaxPlayers);
      config = sgsConfig as unknown as RoleConfig;
    } else {
      const resolvedRoleConfig = (roleConfig && Object.keys(roleConfig).length > 0)
        ? roleConfig
        : getDefaultConfig(resolvedMaxPlayers);
      const parseResult = roleConfigSchema.safeParse(resolvedRoleConfig);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map(i => i.message).join(', ');
        return { error: '角色配置格式无效: ' + errorMessages };
      }
      config = parseResult.data;
      const totalRoles = (config.merlin ? 1 : 0) + (config.percival ? 1 : 0)
        + (config.mordred ? 1 : 0) + (config.morgana ? 1 : 0)
        + (config.oberon ? 1 : 0) + (config.assassin ? 1 : 0)
        + config.loyalServants + config.minions;
      if (totalRoles !== resolvedMaxPlayers) {
        return { error: `角色总数(${totalRoles})与房间人数(${resolvedMaxPlayers})不匹配` };
      }
    }

    const code = await this.generateUniqueCode();

    const room = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdRoom = await tx.room.create({
        data: {
          code,
          hostId,
          gameType: isSgs ? GameType.SGS : GameType.AVALON,
          roleConfig: config,
          maxPlayers: resolvedMaxPlayers,
        },
      });

      await tx.roomPlayer.create({
        data: {
          roomId: createdRoom.id,
          userId: hostId,
          seatNo: 1,
        },
      });

      return createdRoom;
    });

    await this.redis.hset(`room:${code}`, 'status', 'WAITING');
    await this.redis.hset(`room:${code}`, 'hostId', hostId);
    await this.redis.hset(`room:${code}`, 'playerCount', '1');
    await this.redis.hset(`room:${code}`, 'maxPlayers', String(resolvedMaxPlayers));

    return {
      ...room,
      gameType: isSgs ? GameType.SGS : GameType.AVALON,
      roleConfig: config,
    };
  }

  async joinRoom(roomCode: string, userId: string): Promise<JoinResult | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };

    const existingPlayer = await this.getPlayer(roomCode, userId);
    if (existingPlayer) return { error: '你已在房间中' };

    const playerCount = await this.getPlayerCount(roomCode);
    if (playerCount >= room.maxPlayers) return { error: '房间已满' };

    const playerRecord = await assignSeat(this.prisma, room.id, userId, room.maxPlayers);

    await this.redis.hset(`room:${roomCode}`, 'playerCount', String(playerCount + 1));

    const playerUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!playerUser) {
      throw new Error('用户不存在');
    }

    const players = await this.getPlayers(roomCode);
    const playerInfo: PlayerInfo = {
      id: playerRecord.id,
      userId: playerRecord.userId,
      seatNo: playerRecord.seatNo,
      isOnline: true,
      joinedAt: playerRecord.joinedAt,
      user: {
        id: playerUser.id,
        nickName: playerUser.nickName,
        avatarUrl: playerUser.avatarUrl,
      },
    };

    return {
      roomState: { room, players },
      player: playerInfo,
      playerCount: playerCount + 1,
    };
  }

  async leaveRoom(roomCode: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomCode);
    if (!room) return;

    // If the host is leaving, transfer host to the player with the smallest seatNo
    if (room.hostId === userId) {
      const remainingPlayers = await this.prisma.roomPlayer.findMany({
        where: { roomId: room.id, userId: { not: userId } },
        orderBy: { seatNo: 'asc' },
        take: 1,
      });
      if (remainingPlayers.length > 0) {
        const newHostId = remainingPlayers[0].userId;
        await this.prisma.room.update({
          where: { id: room.id },
          data: { hostId: newHostId },
        });
        await this.redis.hset(`room:${roomCode}`, 'hostId', newHostId);
      }
    }

    await this.prisma.roomPlayer.deleteMany({
      where: { roomId: room.id, userId },
    });

    const playerCount = await this.getPlayerCount(roomCode);
    await this.redis.del(`room:${roomCode}:offline:${userId}`);
    await this.redis.hset(`room:${roomCode}`, 'playerCount', String(playerCount));
  }

  async kickPlayer(roomCode: string, hostId: string, targetUserId: string): Promise<{ success: true } | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以踢人' };

    await this.prisma.roomPlayer.deleteMany({
      where: { roomId: room.id, userId: targetUserId },
    });

    const playerCount = await this.getPlayerCount(roomCode);
    await this.redis.del(`room:${roomCode}:offline:${targetUserId}`);
    await this.redis.hset(`room:${roomCode}`, 'playerCount', String(playerCount));
    return { success: true };
  }

  async startGame(roomCode: string, hostId: string): Promise<StartResult | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以开始游戏' };
    if (room.status !== 'WAITING') return { error: '游戏已开始' };

    const players = await this.getPlayers(roomCode);
    if (players.length < 5) return { error: '至少需要 5 名玩家' };

    const assignmentResult = this.computeRoleAssignments(room, players);
    if ('error' in assignmentResult) return assignmentResult;
    const { assignments } = assignmentResult;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.persistAssignments(tx, room.id, assignments);

      await tx.room.update({
        where: { id: room.id },
        data: { status: 'PLAYING' },
      });

      await tx.gameRecord.create({
        data: {
          roomId: room.id,
          roles: Object.fromEntries(
            assignments.map((a) => [a.seatNo, a.role])
          ),
        },
      });
    });

    await this.redis.hset(`room:${roomCode}`, 'status', 'PLAYING');

    return { assignments };
  }

  async restartGame(roomCode: string, hostId: string): Promise<StartResult | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以重开游戏' };
    if (room.status !== 'PLAYING') return { error: '游戏尚未开始' };

    const players = await this.getPlayers(roomCode);
    if (players.length < 5) return { error: '至少需要 5 名玩家' };

    const assignmentResult = this.computeRoleAssignments(room, players);
    if ('error' in assignmentResult) return assignmentResult;
    const { assignments } = assignmentResult;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const player of players) {
        await tx.roomPlayer.updateMany({
          where: { roomId: room.id, userId: player.userId },
          data: { role: null },
        });
      }

      await this.persistAssignments(tx, room.id, assignments);

      await tx.gameRecord.create({
        data: {
          roomId: room.id,
          roles: Object.fromEntries(
            assignments.map((a) => [a.seatNo, a.role])
          ),
        },
      });
    });

    await this.redis.hset(`room:${roomCode}`, 'status', 'PLAYING');

    return { assignments };
  }

  /** Shared SGS / Avalon role computation for {@link startGame} and {@link restartGame}. */
  private computeRoleAssignments(
    room: RoomInfo,
    players: PlayerInfo[],
  ): StartResult | { error: string } {
    let assignments: RoleAssignment[];

    if (room.gameType === GameType.SGS) {
      const sgsConfig = room.roleConfig as unknown as SgsRoleConfig;
      assignments = assignSgsRoles(
        players.map((p) => ({ seatNo: p.seatNo, userId: p.userId })),
        sgsConfig,
      );
    } else {
      const parseResult = roleConfigSchema.safeParse(room.roleConfig);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map(i => i.message).join(', ');
        return { error: '角色配置格式无效: ' + errorMessages };
      }
      const config = parseResult.data;
      const totalRoles = (config.merlin ? 1 : 0) + (config.percival ? 1 : 0)
        + (config.mordred ? 1 : 0) + (config.morgana ? 1 : 0)
        + (config.oberon ? 1 : 0) + (config.assassin ? 1 : 0)
        + config.loyalServants + config.minions;
      if (totalRoles !== players.length) {
        return { error: `角色总数(${totalRoles})与玩家数(${players.length})不匹配` };
      }
      assignments = assignRoles(
        players.map((p) => ({ seatNo: p.seatNo, userId: p.userId })),
        config,
      );
    }

    return { assignments };
  }

  private async persistAssignments(
    tx: Prisma.TransactionClient,
    roomId: string,
    assignments: RoleAssignment[],
  ): Promise<void> {
    for (const assignment of assignments) {
      await tx.roomPlayer.updateMany({
        where: { roomId, userId: assignment.userId },
        data: { role: assignment.role },
      });
    }
  }

  async getUserRooms(userId: string): Promise<string[]> {
    const players = await this.prisma.roomPlayer.findMany({
      where: { userId },
      select: { room: { select: { code: true } } },
    });
    return players.map((p: { room: { code: string } }) => p.room.code);
  }

  async getPlayerRole(roomCode: string, userId: string): Promise<string | null> {
    const player = await this.getPlayer(roomCode, userId);
    return player?.role || null;
  }

  async markPlayerOffline(roomCode: string, userId: string): Promise<void> {
    await this.redis.set(`room:${roomCode}:offline:${userId}`, Date.now().toString(), 300);
  }

  async markPlayerOnline(roomCode: string, userId: string): Promise<void> {
    await this.redis.del(`room:${roomCode}:offline:${userId}`);
  }

  async isPlayerOffline(roomCode: string, userId: string): Promise<boolean> {
    const result = await this.redis.get(`room:${roomCode}:offline:${userId}`);
    return result !== null;
  }

  async updatePlayerInfo(userId: string, data: { nickName?: string; avatarUrl?: string }): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickName && { nickName: data.nickName }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
      },
    });
  }

  async updateRoomSettings(
    roomCode: string,
    hostId: string,
    data: { maxPlayers?: number; roleConfig?: PartialRoleConfig },
  ): Promise<RoomInfo | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) {
      return { error: '房间不存在' };
    }
    if (room.hostId !== hostId) {
      return { error: '仅房主可以修改设置' };
    }
    if (room.status !== 'WAITING') {
      return { error: '游戏已开始，无法修改设置' };
    }

    const updates: Partial<{ maxPlayers: number; roleConfig: RoleConfig }> = {};

    if (typeof data.maxPlayers !== 'undefined') {
      const playerCount = await this.getPlayerCount(roomCode);
      if (data.maxPlayers < playerCount) {
        return {
          error: `当前已有${playerCount}名玩家，无法减少至${data.maxPlayers}人`,
        };
      }
      updates.maxPlayers = data.maxPlayers;

      // If maxPlayers changes without an explicit roleConfig, auto-replace with
      // the default config for the new player count to prevent mismatches at game start
      if (typeof data.roleConfig === 'undefined') {
        if (room.gameType === GameType.SGS) {
          const newConfig = getSgsDefaultConfig(data.maxPlayers);
          const totalRoles = newConfig.monarch + newConfig.loyalist + newConfig.rebel + newConfig.traitor;
          if (totalRoles !== data.maxPlayers) {
            return { error: `默认角色总数(${totalRoles})与房间人数(${data.maxPlayers})不匹配` };
          }
          updates.roleConfig = newConfig as unknown as RoleConfig;
        } else {
          const newConfig = getDefaultConfig(data.maxPlayers);
          const totalRoles = (newConfig.merlin ? 1 : 0) + (newConfig.percival ? 1 : 0)
            + (newConfig.mordred ? 1 : 0) + (newConfig.morgana ? 1 : 0)
            + (newConfig.oberon ? 1 : 0) + (newConfig.assassin ? 1 : 0)
            + newConfig.loyalServants + newConfig.minions;
          if (totalRoles !== data.maxPlayers) {
            return { error: `默认角色总数(${totalRoles})与房间人数(${data.maxPlayers})不匹配` };
          }
          updates.roleConfig = newConfig;
        }
      }
    }

    if (typeof data.roleConfig !== 'undefined') {
      // Merge partial roleConfig with current room config so unspecified fields
      // retain their existing values instead of being reset to Zod defaults.
      const mergedConfig = { ...room.roleConfig, ...data.roleConfig };
      const parseResult = roleConfigSchema.safeParse(mergedConfig);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map(i => i.message).join(', ');
        return { error: '角色配置格式无效: ' + errorMessages };
      }
      const config = parseResult.data;
      const totalRoles = (config.merlin ? 1 : 0) + (config.percival ? 1 : 0)
        + (config.mordred ? 1 : 0) + (config.morgana ? 1 : 0)
        + (config.oberon ? 1 : 0) + (config.assassin ? 1 : 0)
        + config.loyalServants + config.minions;
      const targetMax = updates.maxPlayers ?? room.maxPlayers;
      if (totalRoles !== targetMax) {
        return { error: `角色总数(${totalRoles})与房间人数(${targetMax})不匹配` };
      }
      updates.roleConfig = config;
    }

    // If nothing to update, return current room info
    if (updates.maxPlayers === undefined && updates.roleConfig === undefined) {
      const current = await this.getRoom(roomCode);
      return current as RoomInfo;
    }

    const updated = await this.prisma.room.update({
      where: { id: room.id },
      data: updates,
    });

    if (typeof updates.maxPlayers !== 'undefined') {
      await this.redis.hset(`room:${roomCode}`, 'maxPlayers', String(updates.maxPlayers));
    }

    // Return refreshed room info
    const refreshed = await this.getRoom(roomCode);
    return refreshed as RoomInfo;
  }

  @Cron('*/5 * * * *')
  async cleanupOfflinePlayers(): Promise<void> {
    this.logger.log('Running offline player cleanup...');
    const rooms = await this.prisma.room.findMany({
      where: { status: 'WAITING' },
      select: { code: true },
    });

    for (const room of rooms) {
      const players = await this.getPlayers(room.code);
      for (const player of players) {
        if (!player.isOnline) {
          await this.leaveRoom(room.code, player.userId);
          this.logger.log(`Removed offline player ${player.userId} from room ${room.code}`);
        }
      }
    }
  }

  @Cron('*/10 * * * *')
  async cleanupIdleRooms(): Promise<void> {
    this.logger.log('Running idle room cleanup...');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const idleRooms = await this.prisma.room.findMany({
      where: {
        status: 'WAITING',
        updatedAt: { lt: thirtyMinutesAgo },
      },
      select: { id: true, code: true },
    });

    for (const room of idleRooms) {
      await this.prisma.roomPlayer.deleteMany({ where: { roomId: room.id } });
      await this.prisma.room.delete({ where: { id: room.id } });
      await this.redis.del(`room:${room.code}`);
      this.logger.log(`Deleted idle room ${room.code}`);
    }
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode();
      const existing = await this.prisma.room.findUnique({
        where: { code },
      });
      if (!existing) return code;
    }
    throw new Error('房间码生成失败，请重试');
  }
}
