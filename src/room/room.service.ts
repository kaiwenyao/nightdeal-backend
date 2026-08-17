import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameType, Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { RedisLockLease, RedisService } from '../redis/redis.service';
import { RoleConfig, roleConfigSchema, getDefaultConfig, PartialRoleConfig } from './role-config.schema';
import { RoleAssignment } from './role-assigner';
import {
  assignSgsRoles,
  SgsRoleConfig,
  SgsRoleConfigSchema,
  getSgsDefaultConfig,
  SGS_MAX_PLAYERS,
} from './sgs-role-assigner';
import { assignSeat } from './seat-assigner';
import {
  generateRoles as generateAvalonRoles,
  assignRoles as assignAvalonRoles,
} from '../avalon/game-engine';
import {
  AvalonRole,
  AvalonGameConfig,
  AvalonGameState,
  DEFAULT_AVALON_CONFIG,
  FACTION_COUNTS,
} from '../avalon/types';
import { PLAYER_OFFLINE_GRACE_MS, ROOM_HASH_TTL_SECONDS } from './room.constants';
import { customAlphabet } from 'nanoid';

const generateRoomCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

/**
 * 把房间的角色配置（布尔开关形式）转换成 avalon 引擎的游戏配置。
 * 好人/邪恶的填充人数由引擎按 FACTION_COUNTS 自动补足，
 * 因此只需把启用的特殊角色传入 roles。
 */
function buildAvalonGameConfig(roleConfig: RoleConfig): AvalonGameConfig {
  const roles: AvalonRole[] = [];
  if (roleConfig.merlin) roles.push('Merlin');
  if (roleConfig.percival) roles.push('Percival');
  if (roleConfig.morgana) roles.push('Morgana');
  if (roleConfig.mordred) roles.push('Mordred');
  if (roleConfig.oberon) roles.push('Oberon');
  if (roleConfig.assassin) roles.push('Assassin');
  return { ...DEFAULT_AVALON_CONFIG, roles };
}

/**
 * 校验房间的 Avalon 角色配置是否和该人数局真正会发出的牌一致。
 *
 * 引擎只认 {@link buildAvalonGameConfig} 传过去的特殊角色，忠臣/爪牙数量由
 * FACTION_COUNTS 自动补足；所以只把 loyalServants + minions 加起来对总人数
 * 是校验不到东西的——8 人配 6 忠臣 0 爪牙同样能凑够 8，引擎却按 5 好 3 坏发牌，
 * 房主看到的和实际开的是两局不同的游戏。这里直接按阵营人数校验。
 *
 * @returns 错误信息；配置合法时返回 null
 */
function validateAvalonRoleConfig(
  roleConfig: RoleConfig,
  playerCount: number,
): string | null {
  const factionCount = FACTION_COUNTS[playerCount];
  if (!factionCount) {
    return `不支持 ${playerCount} 人游戏`;
  }

  const goodSpecials = (roleConfig.merlin ? 1 : 0) + (roleConfig.percival ? 1 : 0);
  const evilSpecials = (roleConfig.mordred ? 1 : 0) + (roleConfig.morgana ? 1 : 0)
    + (roleConfig.oberon ? 1 : 0) + (roleConfig.assassin ? 1 : 0);

  if (goodSpecials > factionCount.good) {
    return `好人角色数量(${goodSpecials})超过好人数量(${factionCount.good})`;
  }
  if (evilSpecials > factionCount.evil) {
    return `邪恶角色数量(${evilSpecials})超过邪恶数量(${factionCount.evil})`;
  }

  const expectedLoyalServants = factionCount.good - goodSpecials;
  const expectedMinions = factionCount.evil - evilSpecials;
  if (
    roleConfig.loyalServants !== expectedLoyalServants
    || roleConfig.minions !== expectedMinions
  ) {
    return `角色配置与 ${playerCount} 人局不匹配：忠臣应为 ${expectedLoyalServants} 人、`
      + `爪牙应为 ${expectedMinions} 人`;
  }

  return null;
}

interface RoomBaseInfo {
  id: string;
  code: string;
  hostId: string;
  status: string;
  maxPlayers: number;
  isRandomSeat: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RoomInfo =
  | (RoomBaseInfo & { gameType: 'AVALON'; roleConfig: RoleConfig })
  | (RoomBaseInfo & { gameType: 'SGS'; roleConfig: SgsRoleConfig });

export interface PlayerInfo {
  id: string;
  userId: string;
  seatNo: number;
  role?: string;
  isOnline: boolean;
  joinedAt: Date;
  user: { id: string; nickName: string; avatarUrl: string };
}

export type LeaveOutcome = 'removed' | 'offline' | 'not_found';

export interface JoinResult {
  roomState: { room: RoomInfo; players: PlayerInfo[] };
  player: PlayerInfo;
  playerCount: number;
}

export interface StartResult {
  assignments: RoleAssignment[];
  /** 事务内读到的游戏类型，供调用方在房间状态读取失败时兜底。 */
  gameType: GameType;
}

/** {@link RoomService.computeRoleAssignments} 的结果。 */
interface RoleComputation {
  assignments: RoleAssignment[];
  /**
   * 仅 Avalon：与本次角色分配同源的引擎配置。
   * 事务提交后初始化 Redis 游戏状态时必须复用它，
   * 否则用房间快照重新构建会和实际发出的角色不一致。
   */
  avalonConfig?: AvalonGameConfig;
}

/**
 * Broadcast callbacks implemented by RoomGateway. Registered via
 * {@link RoomService.setEventsNotifier} so service-level cleanup (cron jobs)
 * can notify WebSocket clients without RoomService depending on the gateway
 * (which would create a circular dependency).
 */
export interface RoomEventsNotifier {
  notifyClientsAfterLeave(roomCode: string, userId: string): Promise<void>;
}

/**
 * Avalon game-state initializer, implemented by AvalonService and registered
 * via {@link RoomService.setAvalonGameInitializer} (from AvalonGateway's
 * onModuleInit). Same setter-injection pattern as {@link RoomEventsNotifier}:
 * RoomModule must not import AvalonModule (AvalonModule already imports
 * RoomModule for the gateway), so a direct constructor dependency would create
 * a module cycle.
 */
export interface AvalonGameInitializer {
  initializeGame(
    roomCode: string,
    players: { seatNo: number; userId: string; name: string; isHost: boolean }[],
    config: AvalonGameConfig,
    precomputedAssignments?: { userId: string; role: AvalonRole }[],
    generationId?: string,
  ): Promise<unknown>;
  updateHost?(roomCode: string, hostId: string): Promise<void>;
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private eventsNotifier: RoomEventsNotifier | null = null;
  private avalonGameInitializer: AvalonGameInitializer | null = null;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  setEventsNotifier(notifier: RoomEventsNotifier): void {
    this.eventsNotifier = notifier;
  }

  setAvalonGameInitializer(initializer: AvalonGameInitializer): void {
    this.avalonGameInitializer = initializer;
  }

  async getRoom(roomCode: string): Promise<RoomInfo | null> {
    const room = await this.prisma.room.findUnique({
      where: { code: roomCode },
    });
    if (!room) return null;
    if (room.gameType === GameType.SGS) {
      return {
        ...room,
        gameType: GameType.SGS,
        roleConfig: room.roleConfig as SgsRoleConfig,
      };
    }

    return {
      ...room,
      gameType: GameType.AVALON,
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

    // Fetch offline markers concurrently instead of one Redis round trip per
    // player. (A true pipeline would need RedisService support, which is out of
    // scope here; parallel gets already collapse the N+1 latency.)
    const offlineFlags = await Promise.all(
      players.map((p) => this.isPlayerOffline(roomCode, p.userId)),
    );

    const result: PlayerInfo[] = players.map((p, i) => ({
      id: p.id,
      userId: p.userId,
      seatNo: p.seatNo,
      role: p.role || undefined,
      isOnline: !offlineFlags[i],
      joinedAt: p.joinedAt ?? undefined,
      user: {
        id: p.user.id,
        nickName: p.user.nickName,
        avatarUrl: p.user.avatarUrl,
      },
    }));
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
    roleConfig?: PartialRoleConfig | Partial<SgsRoleConfig>,
    maxPlayers?: number,
    gameType: GameType = GameType.AVALON,
    isRandomSeat?: boolean,
  ): Promise<RoomInfo | { error: string }> {
    const resolvedMaxPlayers = maxPlayers || (gameType === GameType.SGS ? 2 : 5);
    const isSgs = gameType === GameType.SGS;
    const minForGame = isSgs ? 2 : 5;
    const maxForGame = isSgs ? SGS_MAX_PLAYERS : 10;
    if (resolvedMaxPlayers < minForGame || resolvedMaxPlayers > maxForGame) {
      return { error: `房间人数需在 ${minForGame}-${maxForGame} 人之间` };
    }

    let config: RoleConfig | SgsRoleConfig;
    if (isSgs) {
      const resolvedRoleConfig = (roleConfig && Object.keys(roleConfig).length > 0)
        ? roleConfig
        : getSgsDefaultConfig(resolvedMaxPlayers);
      const parseResult = SgsRoleConfigSchema.safeParse(resolvedRoleConfig);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map(i => i.message).join(', ');
        return { error: 'SGS 角色配置格式无效: ' + errorMessages };
      }
      config = parseResult.data;
      const totalRoles = config.monarch + config.loyalist + config.rebel + config.traitor;
      if (totalRoles !== resolvedMaxPlayers) {
        return { error: `角色总数(${totalRoles})与房间人数(${resolvedMaxPlayers})不匹配` };
      }
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
          isRandomSeat: isRandomSeat ?? false,
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

    // Only lastActiveAt is ever read from this hash (idle-room cleanup);
    // status/hostId/playerCount/maxPlayers mirrors were write-only and have
    // been removed to eliminate stale-data footguns.
    // The TTL goes on with every write (see hsetWithExpire): a bare hset would
    // resurrect an expired hash without any expiry.
    await this.redis.hsetWithExpire(
      `room:${code}`,
      'lastActiveAt',
      Date.now().toString(),
      ROOM_HASH_TTL_SECONDS,
    );

    if (isSgs) {
      return {
        ...room,
        gameType: GameType.SGS,
        roleConfig: config as SgsRoleConfig,
      };
    }
    return {
      ...room,
      gameType: GameType.AVALON,
      roleConfig: config as RoleConfig,
    };
  }

  async joinRoom(roomCode: string, userId: string): Promise<JoinResult | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.status === 'PLAYING') return { error: '游戏已开始，无法加入' };
    const existingPlayer = await this.getPlayer(roomCode, userId);
    if (existingPlayer) return { error: '你已在房间中' };

    // Use transaction to prevent race condition on maxPlayers check
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock the room row FIRST via a status-guarded update. The row lock is
      // held until commit, which serializes us against concurrent joins (so the
      // maxPlayers check below cannot be passed by two joiners at once) and
      // against startGame's WAITING→PLAYING flip (it blocks on this lock and
      // re-evaluates the status predicate afterwards).
      const locked = await tx.room.updateMany({
        where: { id: room.id, status: 'WAITING' },
        data: { updatedAt: new Date() },
      });
      if (locked.count === 0) {
        return { error: '房间不存在或游戏已开始' };
      }

      // Re-read maxPlayers INSIDE the transaction, now that we hold the room
      // row lock: the getRoom() snapshot above may be stale if a concurrent
      // updateRoomSettings lowered the limit, and admitting a player against
      // a limit that no longer exists would overfill the room.
      const currentRoom = await tx.room.findUnique({
        where: { id: room.id },
        select: { maxPlayers: true },
      });
      if (!currentRoom) {
        return { error: '房间不存在' };
      }

      const currentPlayerCount = await tx.roomPlayer.count({
        where: { roomId: room.id },
      });
      if (currentPlayerCount >= currentRoom.maxPlayers) {
        return { error: '房间已满' };
      }

      const existing = await tx.roomPlayer.findFirst({
        where: { roomId: room.id, userId },
      });
      if (existing) {
        return { error: '你已在房间中' };
      }

      // Must use the transaction client — using this.prisma here would commit
      // the roomPlayer row outside the transaction.
      try {
        const playerRecord = await assignSeat(tx, room.id, userId, currentRoom.maxPlayers);
        return { playerRecord };
      } catch (e) {
        // assignSeat throws HTTP-specific BadRequestException on room-full /
        // already-in-room seat races. On the WebSocket path these would fall to
        // the generic "服务器内部错误" branch of WsExceptionFilter, so convert them
        // to the established { error } shape for a consistent user-facing message.
        if (e instanceof BadRequestException) {
          return { error: e.message };
        }
        throw e;
      }
    });

    if ('error' in result && result.error) return { error: result.error };
    const playerRecord = result.playerRecord!;

    const actualPlayerCount = await this.getPlayerCount(roomCode);

    const playerUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!playerUser) {
      throw new NotFoundException('用户不存在');
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
      playerCount: actualPlayerCount,
    };
  }

  async leaveRoom(
    roomCode: string,
    userId: string,
    skipOfflineMark = false,
    presenceLease?: RedisLockLease,
    expectedPresenceVersion?: number,
  ): Promise<LeaveOutcome> {
    if (!presenceLease) {
      return this.redis.withLock(
        `lock:room:${roomCode}:presence`,
        10_000,
        (lease) => this.leaveRoom(
          roomCode,
          userId,
          skipOfflineMark,
          lease,
          expectedPresenceVersion,
        ),
      );
    }
    const room = await this.getRoom(roomCode);
    if (!room) return 'not_found';

    if (room.status === 'PLAYING') {
      if (!skipOfflineMark) await this.markPlayerOffline(roomCode, userId, true, presenceLease);
      return 'offline';
    }
    const presence = expectedPresenceVersion !== undefined
      ? { presenceVersion: expectedPresenceVersion }
      : await this.prisma.roomPlayer.findFirst({
        where: { roomId: room.id, userId },
        select: { presenceVersion: true },
      });
    if (!presence) return 'not_found';

    // If the host is leaving, transfer host to another member, preferring an
    // online one (smallest seatNo as tie-breaker) so room management stays usable.
    if (room.hostId === userId) {
      const remainingPreview = await this.prisma.roomPlayer.findMany({
        where: { roomId: room.id, userId: { not: userId } },
        orderBy: { seatNo: 'asc' },
      });
      const offlineByUserId = new Map(
        await Promise.all(
          remainingPreview.map(async (p) =>
            [p.userId, await this.isPlayerOffline(roomCode, p.userId)] as const,
          ),
        ),
      );

      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Same guard as the non-host branch below: we read WAITING above, but a
        // concurrent startGame may have flipped the room to PLAYING (roles
        // persisted) since. Deleting the host's row then would silently drop a
        // PLAYING game's role and desync the Avalon Redis state, so only touch
        // the room while it is still WAITING.
        const guard = await tx.room.updateMany({
          where: { id: room.id, status: 'WAITING' },
          data: { updatedAt: new Date() },
        });
        if (guard.count === 0) return { playing: true as const };

        const deletedPlayer = await tx.roomPlayer.deleteMany({
          where: { roomId: room.id, userId, presenceVersion: presence.presenceVersion },
        });
        if (deletedPlayer.count === 0) return { notFound: true as const };

        const remainingPlayers = await tx.roomPlayer.findMany({
          where: { roomId: room.id },
          orderBy: { seatNo: 'asc' },
        });
        if (remainingPlayers.length > 0) {
          let newHostId = remainingPlayers[0].userId;
          for (const candidate of remainingPlayers) {
            if (!offlineByUserId.get(candidate.userId)) {
              newHostId = candidate.userId;
              break;
            }
          }
          await tx.room.update({
            where: { id: room.id },
            data: { hostId: newHostId, updatedAt: new Date() },
          });
          return { newHostId };
        } else {
          // Last player leaving — delete the room
          await tx.room.delete({ where: { id: room.id } });
          return { deleted: true as const };
        }
      });

      if ('notFound' in result && result.notFound) return 'not_found';
      if ('playing' in result && result.playing) {
        // The room started while the host's leave was in flight. Keep the
        // seat/role consistent with the PLAYING path instead of removing them.
        if (!skipOfflineMark) await this.markPlayerOffline(roomCode, userId, true, presenceLease);
        return 'offline';
      }

      if ('deleted' in result && result.deleted) {
        await this.redis.del(`room:${roomCode}`);
        await this.deleteOfflineMarker(roomCode, userId, presenceLease);
        return 'removed';
      }
    } else {
      const leaving = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Guard against a concurrent startGame: we may have read WAITING above
        // but the room could have flipped to PLAYING (role assignments
        // persisted) since. Deleting the row then would silently drop a
        // PLAYING game's role and desync the Avalon Redis state, so only delete
        // while the room is still WAITING; otherwise leave the player in place
        // and let the caller mark them offline instead.
        const guard = await tx.room.updateMany({
          where: { id: room.id, status: 'WAITING' },
          data: { updatedAt: new Date() },
        });
        if (guard.count === 0) return 'playing' as const;
        const deleted = await tx.roomPlayer.deleteMany({
          where: { roomId: room.id, userId, presenceVersion: presence.presenceVersion },
        });
        return deleted.count > 0 ? 'deleted' as const : 'not_found' as const;
      });

      if (leaving === 'playing') {
        // The room started while this player's leave was in flight. Keep the
        // seat/role consistent with the PLAYING path instead of removing them.
        if (!skipOfflineMark) await this.markPlayerOffline(roomCode, userId, true, presenceLease);
        return 'offline';
      }
      if (leaving === 'not_found') return 'not_found';
    }

    await this.deleteOfflineMarker(roomCode, userId, presenceLease);
    return 'removed';
  }

  private async deleteOfflineMarker(
    roomCode: string,
    userId: string,
    lease?: RedisLockLease,
  ): Promise<void> {
    const key = `room:${roomCode}:offline:${userId}`;
    if (lease) await this.redis.delWithLock(lease, key);
    else await this.redis.del(key);
  }

  async kickPlayer(roomCode: string, hostId: string, targetUserId: string): Promise<{ success: true } | { error: string }> {
    try {
      return await this.redis.withLock(
        `lock:room:${roomCode}:presence`,
        10_000,
        (lease) => this.kickPlayerUnderLock(roomCode, hostId, targetUserId, lease),
      );
    } catch (error) {
      if ((error as Error).message === 'LOCK_BUSY') return { error: '玩家状态正在变更，请稍后重试' };
      throw error;
    }
  }

  private async kickPlayerUnderLock(
    roomCode: string,
    hostId: string,
    targetUserId: string,
    presenceLease: RedisLockLease,
  ): Promise<{ success: true } | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以踢人' };
    if (targetUserId === hostId) return { error: '房主不能踢出自己' };
    if (room.status === 'PLAYING') return { error: '游戏进行中，无法踢人' };

    const deleted = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Revalidate host and WAITING while holding the room row lock. The
      // pre-transaction snapshot may become stale if startGame races the kick.
      const guard = await tx.room.updateMany({
        where: { id: room.id, status: 'WAITING', hostId },
        data: { updatedAt: new Date() },
      });
      if (guard.count === 0) return { error: '游戏已开始或房主已变更' } as const;
      const target = await tx.roomPlayer.findFirst({
        where: { roomId: room.id, userId: targetUserId },
        select: { presenceVersion: true },
      });
      if (!target) return { error: '该玩家不在房间中' } as const;
      const result = await tx.roomPlayer.deleteMany({
        where: {
          roomId: room.id,
          userId: targetUserId,
          presenceVersion: target.presenceVersion,
        },
      });
      return result.count === 0
        ? ({ error: '该玩家不在房间中' } as const)
        : ({ success: true } as const);
    });
    if ('error' in deleted) return deleted;

    await this.redis.delWithLock(presenceLease, `room:${roomCode}:offline:${targetUserId}`);
    return { success: true };
  }

  async startGame(roomCode: string, hostId: string): Promise<StartResult | { error: string }> {
    try {
      return await this.redis.withLock(
        `lock:room:${roomCode}:lifecycle`,
        120_000,
        () => this.startGameUnderLock(roomCode, hostId),
      );
    } catch (error) {
      if ((error as Error).message === 'LOCK_BUSY') {
        return { error: '房间状态正在变更，请稍后重试' };
      }
      throw error;
    }
  }

  private async startGameUnderLock(roomCode: string, hostId: string): Promise<StartResult | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以开始游戏' };

    try {
      const started = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Atomically flip WAITING → PLAYING first. The update takes the room
        // row lock until commit, so a concurrent startGame gets count === 0
        // (exactly one start wins) and a concurrent joinRoom blocks on the
        // lock and then sees PLAYING. Business-rule failures below throw to
        // roll the flip back.
        const flip = await tx.room.updateMany({
          where: { id: room.id, status: 'WAITING', hostId },
          data: { status: 'PLAYING' },
        });
        if (flip.count === 0) {
          throw new BadRequestException('游戏已开始');
        }

        // Re-read the room INSIDE the transaction (after the WAITING→PLAYING
        // flip acquires the room row lock) so roleConfig / isRandomSeat are the
        // latest committed values. The room snapshot from getRoom() above may be
        // stale if a concurrent updateRoomSettings committed between the read
        // and this flip; using a stale config here would compute roles from
        // outdated settings.
        const currentRoom = await tx.room.findUnique({ where: { id: room.id } });
        if (!currentRoom) {
          throw new BadRequestException('房间不存在');
        }

        // Read the player list INSIDE the transaction (after acquiring the
        // room lock) so a concurrent leave cannot lose its role cleanup and a
        // concurrent join cannot produce a role-less player.
        let players = await tx.roomPlayer.findMany({
          where: { roomId: room.id },
          orderBy: { seatNo: 'asc' },
        });

        const minPlayers = currentRoom.gameType === GameType.SGS ? 2 : 5;
        if (players.length < minPlayers) {
          throw new BadRequestException(`至少需要 ${minPlayers} 名玩家`);
        }

        const isRandomSeat = currentRoom.isRandomSeat;
        // Shuffle seat numbers if random seat is enabled
        if (isRandomSeat) {
          const shuffledPlayers = [...players];
          for (let i = shuffledPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
          }
          players = shuffledPlayers.map((p, i) => ({ ...p, seatNo: i + 1 }));
        }

        const assignmentResult = this.computeRoleAssignments({
          ...room,
          gameType: currentRoom.gameType as GameType,
          roleConfig: currentRoom.roleConfig as never,
          isRandomSeat,
        }, players);
        if ('error' in assignmentResult) {
          throw new BadRequestException(assignmentResult.error);
        }
        const { assignments, avalonConfig } = assignmentResult;

        // Persist shuffled seat numbers before role assignments.
        // Two-phase update avoids UNIQUE constraint violation on @@unique([roomId, seatNo]).
        if (isRandomSeat) {
          const tempOffset = players.length + 1;
          for (const player of players) {
            await tx.roomPlayer.updateMany({
              where: { roomId: room.id, userId: player.userId },
              data: { seatNo: -(player.seatNo + tempOffset) },
            });
          }
          for (const player of players) {
            await tx.roomPlayer.updateMany({
              where: { roomId: room.id, userId: player.userId },
              data: { seatNo: player.seatNo },
            });
          }
        }

        await this.persistAssignments(tx, room.id, assignments);

        // Heal any legacy/open record left by an interrupted rollback before
        // creating the generation token for this game.
        await tx.gameRecord.updateMany({
          where: { roomId: room.id, endedAt: null },
          data: { endedAt: new Date() },
        });
        const gameRecord = await tx.gameRecord.create({
          data: {
            roomId: room.id,
            roles: Object.fromEntries(
              assignments.map((a) => [a.seatNo, a.role])
            ),
          },
        });

        return {
          assignments,
          avalonConfig,
          gameType: currentRoom.gameType as GameType,
          gameRecordId: gameRecord.id,
        };
      });

      const { assignments, avalonConfig, gameType, gameRecordId } = started;

      // Avalon 房间：事务提交后再初始化 Redis 游戏状态（避免回滚留下脏状态）。
      // 角色分配与引擎配置都在事务内算好，这里原样复用，
      // 保证 avalon 游戏状态与 roomPlayer.role（即 room:started 的 yourRole）一致。
      if (gameType !== GameType.SGS) {
        if (!avalonConfig) {
          // Unreachable: the Avalon branch of computeRoleAssignments always sets
          // the config or returns an error. Fail loudly rather than starting a
          // game with no Redis state.
          throw new InternalServerErrorException('Avalon 游戏配置缺失');
        }
        const initError = await this.initializeAvalonGame(room, assignments, avalonConfig, gameRecordId);
        if (initError) {
          let rollbackOk = false;
          try {
            const current = await this.getRoom(room.code);
            if (current?.status === 'PLAYING') {
              rollbackOk = await this.resetRoomToWaiting(current, gameRecordId);
            } else {
              // A non-PLAYING room makes any stale state inert. Do not perform
              // an unfenced delete that could target a successor generation.
              rollbackOk = true;
            }
          } catch (rollbackErr) {
            this.logger.error(
              `Failed to roll back startGame after Avalon init failure for room ${room.code}:`,
              rollbackErr,
            );
          }
          // The Redis state lock can fail independently. Fall back to the same
          // generation-guarded DB cleanup so status, roles, and the open record
          // never diverge; stale Redis state is inert while DB is WAITING.
          if (!rollbackOk) {
            try {
              // No state lease is available here. Repair only the exact DB
              // generation; stale Redis state is inert while DB is WAITING.
              rollbackOk = await this.resetRoomDatabase(room, gameRecordId);
            } catch (forceErr) {
              this.logger.error(
                `CRITICAL: Room ${room.code} may be stuck in PLAYING with no Avalon state after rollback failure:`,
                forceErr,
              );
              return { error: 'Avalon 游戏状态初始化失败，房间可能仍是进行中状态，请尝试结束游戏或等待自动清理' };
            }
          }
          return initError;
        }
      }

      return { assignments, gameType };
    } catch (e) {
      // Business-rule failures raised inside the transaction (after rollback)
      // are returned in the established { error } union shape.
      if (e instanceof BadRequestException) {
        return { error: e.message };
      }
      throw e;
    }
  }

  async endGame(roomCode: string, hostId: string): Promise<{ success: true } | { error: string }> {
    try {
      return await this.redis.withLock(
        `lock:room:${roomCode}:lifecycle`,
        120_000,
        () => this.endGameUnderLock(roomCode, hostId),
      );
    } catch (error) {
      if ((error as Error).message === 'LOCK_BUSY') {
        return { error: '房间状态正在变更，请稍后重试' };
      }
      throw error;
    }
  }

  private async endGameUnderLock(roomCode: string, hostId: string): Promise<{ success: true } | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以结束游戏' };
    if (room.status !== 'PLAYING') return { error: '游戏尚未开始' };
    // Capture the generation immediately after acquiring the lifecycle lease.
    // If this owner later loses the lease, the reset CAS cannot target a newer game.
    const activeGame = await this.prisma.gameRecord.findFirst({
      where: { roomId: room.id, endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });
    if (!activeGame) return { error: '当前游戏记录不存在，请刷新后重试' };

    const reset = await this.resetRoomToWaiting(room, activeGame.id, hostId);
    return reset ? { success: true } : { error: '游戏状态已变更，请刷新后重试' };
  }

  private async resetRoomToWaiting(
    room: RoomInfo,
    expectedGameRecordId: string,
    requiredHostId?: string,
  ): Promise<boolean> {
    const reset = await this.resetRoomDatabase(room, expectedGameRecordId, requiredHostId);
    if (!reset) return false;
    await this.redis.withLock(`lock:avalon:${room.code}:state`, 30_000, async (lease) => {
      await this.deleteAvalonState(room.code, expectedGameRecordId, lease);
    });
    return true;
  }

  /**
   * Reset exactly one game generation. Ending the record first prevents a
   * delayed owner whose Redis lease was lost from resetting a newer game.
   */
  private async resetRoomDatabase(
    room: RoomInfo,
    expectedGameRecordId: string,
    requiredHostId?: string,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const guard = await tx.room.updateMany({
        where: {
          id: room.id,
          status: 'PLAYING',
          ...(requiredHostId ? { hostId: requiredHostId } : {}),
        },
        data: { updatedAt: new Date() },
      });
      if (guard.count === 0) return false;

      const ended = await tx.gameRecord.updateMany({
        where: { id: expectedGameRecordId, roomId: room.id, endedAt: null },
        data: { endedAt: new Date() },
      });
      if (ended.count === 0) return false;

      await tx.roomPlayer.updateMany({
        where: { roomId: room.id },
        data: { role: null },
      });
      await tx.room.updateMany({
        where: { id: room.id, status: 'PLAYING' },
        data: { status: 'WAITING' },
      });
      return true;
    });
  }

  private async deleteAvalonState(
    roomCode: string,
    generationId: string,
    lease: RedisLockLease,
  ): Promise<void> {
    try {
      await this.redis.delJsonFieldWithLock(
        lease,
        `avalon:${roomCode}:state`,
        'generationId',
        generationId,
      );
    } catch (error) {
      if ((error as Error).message === 'LOCK_LOST') throw error;
      this.logger.error(`Failed to delete Avalon state for ended room ${roomCode}:`, error);
    }
  }

  /** Shared SGS / Avalon role computation for {@link startGame}. */
  private computeRoleAssignments(
    room: RoomInfo,
    players: { seatNo: number; userId: string }[],
  ): RoleComputation | { error: string } {
    let assignments: RoleAssignment[];
    let avalonConfig: AvalonGameConfig | undefined;

    if (room.gameType === GameType.SGS) {
      const parseResult = SgsRoleConfigSchema.safeParse(room.roleConfig);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map(i => i.message).join(', ');
        return { error: 'SGS 角色配置格式无效: ' + errorMessages };
      }
      const sgsConfig = parseResult.data;
      // Validate role count before assignment so a mismatch surfaces as a
      // clean business error, consistent with the Avalon branch below.
      // Without this, assignSgsRoles() throws and the caller returns HTTP 500.
      const totalRoles = sgsConfig.monarch + sgsConfig.loyalist
        + sgsConfig.rebel + sgsConfig.traitor;
      if (totalRoles !== players.length) {
        return { error: `角色总数(${totalRoles})与玩家数(${players.length})不匹配` };
      }
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
      const validationError = validateAvalonRoleConfig(config, players.length);
      if (validationError) {
        return { error: validationError };
      }
      // Avalon 房间的角色分配以 avalon 引擎为唯一来源（英文枚举角色名），
      // 保证 roomPlayer.role 与 avalon 游戏状态一致。
      try {
        avalonConfig = buildAvalonGameConfig(config);
        const engineRoles = generateAvalonRoles(players.length, avalonConfig);
        const engineAssignments = assignAvalonRoles(
          players.map((p) => ({ seatNo: p.seatNo, userId: p.userId })),
          engineRoles,
        );
        assignments = engineAssignments.map((a) => ({
          seatNo: a.seatNo,
          userId: a.userId,
          role: a.role,
          team: a.faction,
        }));
      } catch (e) {
        this.logger.warn(`Avalon role generation failed for room ${room.code}: ${e}`);
        return { error: '角色分配失败，请检查角色配置' };
      }
    }

    return { assignments, avalonConfig };
  }

  /**
   * 事务提交后为 Avalon 房间初始化 Redis 游戏状态。
   * 失败返回 error：调用方会把房间滚回 WAITING 并删掉 Avalon Redis 状态。
   *
   * `config` 必须是事务内算角色时用的那一份：房间快照里的 roleConfig 可能已被
   * 并发的 updateRoomSettings 改掉，用它重建配置会让 state.config.roles
   * 与真实发到玩家手里的角色对不上。
   */
  private async initializeAvalonGame(
    room: RoomInfo,
    assignments: RoleAssignment[],
    config: AvalonGameConfig,
    gameRecordId: string,
  ): Promise<{ error: string } | void> {
    if (!this.avalonGameInitializer) {
      this.logger.warn(`Avalon game initializer not registered, skipping game-state init for room ${room.code}`);
      return { error: 'Avalon 游戏状态初始化失败' };
    }

    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Hold the room row lock across Redis initialization. A stale starter
        // whose lifecycle lease was lost cannot initialize after another owner
        // ended/restarted the room because the exact generation is revalidated
        // under this lock immediately before the state write.
        const guard = await tx.room.updateMany({
          where: { id: room.id, status: 'PLAYING' },
          data: { updatedAt: new Date() },
        });
        if (guard.count === 0) throw new Error('游戏状态已变更');
        const activeGame = await tx.gameRecord.findFirst({
          where: { id: gameRecordId, roomId: room.id, endedAt: null },
          select: { id: true },
        });
        if (!activeGame) throw new Error('游戏代次已变更');

        const currentRoom = await tx.room.findUnique({
          where: { id: room.id },
          select: { hostId: true },
        });
        if (!currentRoom) throw new Error('房间不存在');
        const players = await tx.roomPlayer.findMany({
          where: { roomId: room.id },
          include: { user: true },
          orderBy: { seatNo: 'asc' },
        });
        await this.avalonGameInitializer!.initializeGame(
          room.code,
          players.map((p) => ({
            seatNo: p.seatNo,
            userId: p.userId,
            name: p.user.nickName,
            isHost: p.userId === currentRoom.hostId,
          })),
          config,
          assignments.map((a) => ({ userId: a.userId, role: a.role as AvalonRole })),
          gameRecordId,
        );
      });
    } catch (error) {
      this.logger.error(`Failed to initialize avalon game state for room ${room.code}:`, error);
      return { error: 'Avalon 游戏状态初始化失败' };
    }
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

  async isActiveGameGeneration(roomCode: string, generationId: string): Promise<boolean> {
    const active = await this.prisma.gameRecord.findFirst({
      where: {
        id: generationId,
        endedAt: null,
        room: { code: roomCode, status: 'PLAYING' },
      },
      select: { id: true },
    });
    return active !== null;
  }

  async getPlayerRole(roomCode: string, userId: string): Promise<string | null> {
    const player = await this.getPlayer(roomCode, userId);
    return player?.role || null;
  }

  async markPlayerOffline(
    roomCode: string,
    userId: string,
    presenceLocked = false,
    presenceLease?: RedisLockLease,
  ): Promise<boolean> {
    if (!presenceLocked) {
      return this.redis.withLock(
        `lock:room:${roomCode}:presence`,
        10_000,
        (lease) => this.markPlayerOffline(roomCode, userId, true, lease),
      );
    }
    if (!presenceLease) throw new Error('Presence update attempted without lock lease');
    const room = await this.getRoom(roomCode);
    if (!room) return false;
    const bumped = await this.prisma.roomPlayer.updateMany({
      where: { roomId: room.id, userId },
      data: { presenceVersion: { increment: 1 } },
    });
    if (bumped.count === 0) return false;
    // No TTL: the marker lives until the player leaves/reconnects or the room
    // is deleted. A TTL would let a still-disconnected player "revive" as online.
    await this.redis.setWithLock(
      presenceLease,
      `room:${roomCode}:offline:${userId}`,
      Date.now().toString(),
    );
    if (room) {
      await this.prisma.room.update({
        where: { id: room.id },
        data: { updatedAt: new Date() },
      });
      await this.redis.hsetWithExpire(
        `room:${roomCode}`,
        'lastActiveAt',
        Date.now().toString(),
        ROOM_HASH_TTL_SECONDS,
      );

      // During a game, transfer the host to another member (preferring an
      // online one) so endGame stays usable even if the host never returns.
      if (room.status === 'PLAYING' && room.hostId === userId) {
        const players = await this.getPlayers(roomCode);
        const successor = players.find((p) => p.userId !== userId && p.isOnline)
          ?? players.find((p) => p.userId !== userId);
        if (successor) {
          const transferred = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const stillMember = await tx.roomPlayer.findFirst({
              where: { roomId: room.id, userId: successor.userId },
            });
            if (!stillMember) {
              return { count: 0 };
            }
            return tx.room.updateMany({
              where: { id: room.id, status: 'PLAYING', hostId: userId },
              data: { hostId: successor.userId },
            });
          });
          if (transferred.count > 0) {
            this.logger.log(`Transferred host of PLAYING room ${roomCode} from offline ${userId} to ${successor.userId}`);
            try {
              await this.avalonGameInitializer?.updateHost?.(roomCode, successor.userId);
            } catch (error) {
              this.logger.error(`Failed to synchronize Avalon host for room ${roomCode}:`, error);
            }
          }
        }
      }
    }
    return true;
  }

  async markPlayerOnline(
    roomCode: string,
    userId: string,
    presenceLocked = false,
    presenceLease?: RedisLockLease,
  ): Promise<boolean> {
    if (!presenceLocked) {
      return this.redis.withLock(
        `lock:room:${roomCode}:presence`,
        10_000,
        (lease) => this.markPlayerOnline(roomCode, userId, true, lease),
      );
    }
    if (!presenceLease) throw new Error('Presence update attempted without lock lease');
    const room = await this.getRoom(roomCode);
    if (!room) return false;
    const bumped = await this.prisma.roomPlayer.updateMany({
      where: { roomId: room.id, userId },
      data: { presenceVersion: { increment: 1 } },
    });
    if (bumped.count === 0) return false;
    await this.redis.delWithLock(presenceLease, `room:${roomCode}:offline:${userId}`);
    if (room) {
      await this.prisma.room.update({
        where: { id: room.id },
        data: { updatedAt: new Date() },
      });
      await this.redis.hsetWithExpire(
        `room:${roomCode}`,
        'lastActiveAt',
        Date.now().toString(),
        ROOM_HASH_TTL_SECONDS,
      );
    }
    return true;
  }

  async isPlayerOffline(roomCode: string, userId: string): Promise<boolean> {
    const result = await this.redis.get(`room:${roomCode}:offline:${userId}`);
    return result !== null;
  }

  async cleanupOfflinePlayer(roomCode: string, userId: string): Promise<LeaveOutcome | 'skipped'> {
    return this.redis.withLock(`lock:room:${roomCode}:presence`, 10_000, async (lease) => {
      const marker = await this.redis.get(`room:${roomCode}:offline:${userId}`);
      const disconnectedAt = marker ? Number(marker) : NaN;
      if (!Number.isFinite(disconnectedAt) || Date.now() - disconnectedAt < PLAYER_OFFLINE_GRACE_MS) {
        return 'skipped';
      }
      const room = await this.getRoom(roomCode);
      if (!room) return 'not_found';
      const player = await this.prisma.roomPlayer.findFirst({
        where: { roomId: room.id, userId },
        select: { presenceVersion: true },
      });
      if (!player) return 'not_found';
      return this.leaveRoom(roomCode, userId, true, lease, player.presenceVersion);
    });
  }

  async updatePlayerInfo(userId: string, data: { nickName?: string; avatarUrl?: string }): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickName !== undefined && { nickName: data.nickName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });
  }

  async updateRoomSettings(
    roomCode: string,
    hostId: string,
    data: { maxPlayers?: number; roleConfig?: PartialRoleConfig | Partial<SgsRoleConfig>; isRandomSeat?: boolean },
  ): Promise<RoomInfo | { error: string }> {
    const snapshot = await this.getRoom(roomCode);
    if (!snapshot) return { error: '房间不存在' };
    if (snapshot.hostId !== hostId) return { error: '仅房主可以修改设置' };
    if (snapshot.status !== 'WAITING') return { error: '游戏已开始，无法修改设置' };
    if (data.maxPlayers === undefined && data.roleConfig === undefined && data.isRandomSeat === undefined) {
      return snapshot;
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // This row lock is the same serialization point used by join/start.
      // Re-read every mutable input only after acquiring it.
      const guard = await tx.room.updateMany({
        where: { id: snapshot.id, status: 'WAITING', hostId },
        data: { updatedAt: new Date() },
      });
      if (guard.count === 0) return { error: '游戏已开始或房主已变更，无法修改设置' };

      const current = await tx.room.findUnique({ where: { id: snapshot.id } });
      if (!current) return { error: '房间不存在' };
      const room = {
        ...current,
        gameType: current.gameType,
        roleConfig: current.roleConfig as RoleConfig | SgsRoleConfig,
      } as RoomInfo;
      const playerCount = await tx.roomPlayer.count({ where: { roomId: room.id } });
      const prepared = this.prepareRoomSettingsUpdates(room, data, playerCount);
      if ('error' in prepared) return prepared;

      const updates = prepared.updates;
      if (Object.keys(updates).length === 0) return room;
      await tx.room.update({ where: { id: room.id }, data: updates });
      return { ...room, ...updates } as RoomInfo;
    });
  }

  private prepareRoomSettingsUpdates(
    room: RoomInfo,
    data: { maxPlayers?: number; roleConfig?: PartialRoleConfig | Partial<SgsRoleConfig>; isRandomSeat?: boolean },
    playerCount: number,
  ): { updates: Partial<{ maxPlayers: number; roleConfig: RoleConfig | SgsRoleConfig; isRandomSeat: boolean }> } | { error: string } {
    const updates: Partial<{ maxPlayers: number; roleConfig: RoleConfig | SgsRoleConfig; isRandomSeat: boolean }> = {};

    if (data.maxPlayers !== undefined) {
      if (data.maxPlayers < playerCount) {
        return { error: `当前已有${playerCount}名玩家，无法减少至${data.maxPlayers}人` };
      }
      const minForGame = room.gameType === GameType.SGS ? 2 : 5;
      const maxForGame = room.gameType === GameType.SGS ? SGS_MAX_PLAYERS : 10;
      if (data.maxPlayers < minForGame || data.maxPlayers > maxForGame) {
        return { error: `房间人数需在 ${minForGame}-${maxForGame} 人之间` };
      }
      updates.maxPlayers = data.maxPlayers;
      if (data.roleConfig === undefined) {
        updates.roleConfig = room.gameType === GameType.SGS
          ? getSgsDefaultConfig(data.maxPlayers)
          : getDefaultConfig(data.maxPlayers);
      }
    }

    if (data.roleConfig !== undefined) {
      const targetMax = updates.maxPlayers ?? room.maxPlayers;
      if (room.gameType === GameType.SGS) {
        const parsed = SgsRoleConfigSchema.safeParse({ ...room.roleConfig, ...data.roleConfig });
        if (!parsed.success) {
          return { error: 'SGS 角色配置格式无效: ' + parsed.error.issues.map(i => i.message).join(', ') };
        }
        const total = parsed.data.monarch + parsed.data.loyalist + parsed.data.rebel + parsed.data.traitor;
        if (total !== targetMax) return { error: `角色总数(${total})与房间人数(${targetMax})不匹配` };
        updates.roleConfig = parsed.data;
      } else {
        const parsed = roleConfigSchema.safeParse({ ...room.roleConfig, ...data.roleConfig });
        if (!parsed.success) {
          return { error: '角色配置格式无效: ' + parsed.error.issues.map(i => i.message).join(', ') };
        }
        const config = parsed.data;
        const total = (config.merlin ? 1 : 0) + (config.percival ? 1 : 0)
          + (config.mordred ? 1 : 0) + (config.morgana ? 1 : 0)
          + (config.oberon ? 1 : 0) + (config.assassin ? 1 : 0)
          + config.loyalServants + config.minions;
        if (total !== targetMax) return { error: `角色总数(${total})与房间人数(${targetMax})不匹配` };
        const factionError = validateAvalonRoleConfig(config, targetMax);
        if (factionError) return { error: factionError };
        updates.roleConfig = config;
      }
    }

    if (data.isRandomSeat !== undefined) updates.isRandomSeat = data.isRandomSeat;
    return { updates };
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
        if (player.isOnline) continue;

        const outcome = await this.cleanupOfflinePlayer(room.code, player.userId);
        if (outcome !== 'removed') continue;
        this.logger.log(`Removed offline player ${player.userId} from room ${room.code}`);
        await this.eventsNotifier?.notifyClientsAfterLeave(room.code, player.userId);
      }
    }
  }

  @Cron('*/10 * * * *')
  async cleanupIdleRooms(): Promise<void> {
    this.logger.log('Running idle room cleanup...');
    const idleThresholdMs = 60 * 60 * 1000; // 1 hour
    const oneHourAgo = new Date(Date.now() - idleThresholdMs);
    // WAITING and PLAYING rooms alike: a PLAYING room whose players all went
    // offline must not linger forever. Room.updatedAt is bumped on every
    // connect/disconnect, so a 1h-stale PLAYING room is an abandoned game
    // (deleting the room cascade-removes its players and game records).
    const idleRooms = await this.prisma.room.findMany({
      where: {
        updatedAt: { lt: oneHourAgo },
      },
      select: { id: true, code: true, status: true },
    });

    for (const room of idleRooms) {
      // Global lock order is DB room row → Avalon state lease. This matches
      // start initialization and avoids a DB↔Redis lock inversion.
      const cleanup = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>(
          Prisma.sql`SELECT "id" FROM "rooms" WHERE "id" = ${room.id} FOR UPDATE`,
        );
        if (locked.length === 0) return null;
        const current = await tx.room.findUnique({
          where: { id: room.id },
          select: { updatedAt: true },
        });
        if (!current || current.updatedAt >= oneHourAgo) return null;

        return this.redis.withLock(`lock:avalon:${room.code}:state`, 30_000, async () => {
          const lastActiveAtStr = await this.redis.hget(`room:${room.code}`, 'lastActiveAt');
          const lastActiveAt = lastActiveAtStr ? Number(lastActiveAtStr) : NaN;
          if (Number.isFinite(lastActiveAt) && lastActiveAt > Date.now() - idleThresholdMs) {
            this.logger.log(`Skipping idle cleanup for room ${room.code}: recent room or game activity`);
            return null;
          }

          const players = await tx.roomPlayer.findMany({
            where: { roomId: room.id },
            select: { userId: true },
          });
          const onlineFlags = await Promise.all(
            players.map(async (player) => !(await this.isPlayerOffline(room.code, player.userId))),
          );
          if (onlineFlags.some(Boolean)) {
            this.logger.log(`Skipping idle cleanup for occupied room ${room.code}`);
            return null;
          }

          const stateJson = await this.redis.get(`avalon:${room.code}:state`);
          let generationId: string | undefined;
          if (stateJson) {
            try {
              generationId = (JSON.parse(stateJson) as AvalonGameState).generationId;
            } catch {
              this.logger.warn(`Ignoring malformed Avalon state during cleanup for room ${room.code}`);
            }
          }

          const deleted = await tx.room.deleteMany({
            where: { id: room.id, updatedAt: { lt: oneHourAgo } },
          });
          if (deleted.count === 0) return null;
          return { userIds: players.map((player) => player.userId), generationId };
        });
      });

      if (!cleanup) continue;
      // PostgreSQL is committed before any irreversible Redis cleanup.
      try {
        await this.redis.del(`room:${room.code}`);
        for (const userId of cleanup.userIds) {
          await this.redis.del(`room:${room.code}:offline:${userId}`);
        }
        if (cleanup.generationId) {
          await this.redis.withLock(`lock:avalon:${room.code}:state`, 30_000, async (lease) => {
            await this.redis.delJsonFieldWithLock(
              lease,
              `avalon:${room.code}:state`,
              'generationId',
              cleanup.generationId!,
            );
          });
        }
      } catch (error) {
        this.logger.error(`Failed Redis cleanup for deleted room ${room.code}:`, error);
      }
      this.logger.log(`Deleted idle room ${room.code}${room.status === 'PLAYING' ? ' (abandoned game forced to end)' : ''}`);
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
    throw new InternalServerErrorException('房间码生成失败，请重试');
  }
}
