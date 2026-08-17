import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameType, Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
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
  DEFAULT_AVALON_CONFIG,
} from '../avalon/types';
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

export interface JoinResult {
  roomState: { room: RoomInfo; players: PlayerInfo[] };
  player: PlayerInfo;
  playerCount: number;
}

export interface StartResult {
  assignments: RoleAssignment[];
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
  ): Promise<unknown>;
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
    await this.redis.hset(`room:${code}`, 'lastActiveAt', Date.now().toString());
    // Set 24h TTL on room hash to prevent stale Redis keys
    await this.redis.expire(`room:${code}`, 86400);

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

      const currentPlayerCount = await tx.roomPlayer.count({
        where: { roomId: room.id },
      });
      if (currentPlayerCount >= room.maxPlayers) {
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
        const playerRecord = await assignSeat(tx, room.id, userId, room.maxPlayers);
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

  async leaveRoom(roomCode: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomCode);
    if (!room) return;

    if (room.status === 'PLAYING') {
      await this.markPlayerOffline(roomCode, userId);
      return;
    }

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
        const remainingPlayers = await tx.roomPlayer.findMany({
          where: { roomId: room.id, userId: { not: userId } },
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
          await tx.roomPlayer.deleteMany({
            where: { roomId: room.id, userId },
          });
          return { newHostId };
        } else {
          // Last player leaving — delete the room
          await tx.room.delete({ where: { id: room.id } });
          return { deleted: true as const };
        }
      });

      if ('deleted' in result && result.deleted) {
        await this.redis.del(`room:${roomCode}`);
        await this.redis.del(`room:${roomCode}:offline:${userId}`);
        return;
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
        await tx.roomPlayer.deleteMany({
          where: { roomId: room.id, userId },
        });
        return 'deleted' as const;
      });

      if (leaving === 'playing') {
        // The room started while this player's leave was in flight. Keep the
        // seat/role consistent with the PLAYING path instead of removing them.
        await this.markPlayerOffline(roomCode, userId);
        return;
      }
    }

    await this.redis.del(`room:${roomCode}:offline:${userId}`);
  }

  async kickPlayer(roomCode: string, hostId: string, targetUserId: string): Promise<{ success: true } | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以踢人' };
    if (targetUserId === hostId) return { error: '房主不能踢出自己' };
    if (room.status === 'PLAYING') return { error: '游戏进行中，无法踢人' };

    // deleteMany is atomic check-and-delete: count 0 means the target is not
    // in the room (anymore), which must surface as an error, not a silent success.
    const deleted = await this.prisma.roomPlayer.deleteMany({
      where: { roomId: room.id, userId: targetUserId },
    });
    if (deleted.count === 0) {
      return { error: '该玩家不在房间中' };
    }

    await this.redis.del(`room:${roomCode}:offline:${targetUserId}`);
    return { success: true };
  }

  async startGame(roomCode: string, hostId: string): Promise<StartResult | { error: string }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以开始游戏' };

    try {
      const assignments = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Atomically flip WAITING → PLAYING first. The update takes the room
        // row lock until commit, so a concurrent startGame gets count === 0
        // (exactly one start wins) and a concurrent joinRoom blocks on the
        // lock and then sees PLAYING. Business-rule failures below throw to
        // roll the flip back.
        const flip = await tx.room.updateMany({
          where: { id: room.id, status: 'WAITING' },
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
        const { assignments } = assignmentResult;

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

        await tx.gameRecord.create({
          data: {
            roomId: room.id,
            roles: Object.fromEntries(
              assignments.map((a) => [a.seatNo, a.role])
            ),
          },
        });

        return assignments;
      });

      // Avalon 房间：事务提交后再初始化 Redis 游戏状态（避免回滚留下脏状态）。
      // 角色分配已在事务内由 avalon 引擎计算并持久化，这里复用同一份分配，
      // 保证 avalon 游戏状态与 roomPlayer.role（即 room:started 的 yourRole）一致。
      if (room.gameType !== GameType.SGS) {
        const initError = await this.initializeAvalonGame(room, assignments);
        if (initError) {
          let rollbackOk = false;
          try {
            const current = await this.getRoom(room.code);
            if (current?.status === 'PLAYING') {
              await this.resetRoomToWaiting(current);
            } else {
              await this.redis.del(`avalon:${room.code}:state`);
            }
            rollbackOk = true;
          } catch (rollbackErr) {
            this.logger.error(
              `Failed to roll back startGame after Avalon init failure for room ${room.code}:`,
              rollbackErr,
            );
          }
          // If the rollback could not restore WAITING, the room may be stuck in
          // PLAYING with persisted roles but no Avalon Redis state. Make a
          // last-resort attempt to force it back to WAITING so the room is not
          // permanently unplayable, then tell the host how to recover.
          if (!rollbackOk) {
            try {
              const forced = await this.prisma.room.updateMany({
                where: { id: room.id, status: 'PLAYING' },
                data: { status: 'WAITING' },
              });
              if (forced.count === 0) {
                this.logger.warn(`Room ${room.code} is not PLAYING anymore during rollback; skipping force-reset`);
              } else {
                await this.redis.del(`avalon:${room.code}:state`);
              }
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

      return { assignments };
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
    const room = await this.getRoom(roomCode);
    if (!room) return { error: '房间不存在' };
    if (room.hostId !== hostId) return { error: '仅房主可以结束游戏' };
    if (room.status !== 'PLAYING') return { error: '游戏尚未开始' };

    await this.resetRoomToWaiting(room);
    return { success: true };
  }

  /** Drop PLAYING → WAITING and delete Avalon Redis state. No host check. */
  private async resetRoomToWaiting(room: RoomInfo): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.roomPlayer.updateMany({
        where: { roomId: room.id },
        data: { role: null },
      });
      await tx.room.update({
        where: { id: room.id },
        data: { status: 'WAITING' },
      });
      await tx.gameRecord.updateMany({
        where: { roomId: room.id, endedAt: null },
        data: { endedAt: new Date() },
      });
    });
    await this.redis.del(`avalon:${room.code}:state`);
  }

  /** Shared SGS / Avalon role computation for {@link startGame}. */
  private computeRoleAssignments(
    room: RoomInfo,
    players: { seatNo: number; userId: string }[],
  ): StartResult | { error: string } {
    let assignments: RoleAssignment[];

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
      const totalRoles = (config.merlin ? 1 : 0) + (config.percival ? 1 : 0)
        + (config.mordred ? 1 : 0) + (config.morgana ? 1 : 0)
        + (config.oberon ? 1 : 0) + (config.assassin ? 1 : 0)
        + config.loyalServants + config.minions;
      if (totalRoles !== players.length) {
        return { error: `角色总数(${totalRoles})与玩家数(${players.length})不匹配` };
      }
      // Avalon 房间的角色分配以 avalon 引擎为唯一来源（英文枚举角色名），
      // 保证 roomPlayer.role 与 avalon 游戏状态一致。
      try {
        const avalonConfig = buildAvalonGameConfig(config);
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

    return { assignments };
  }

  /**
   * 事务提交后为 Avalon 房间初始化 Redis 游戏状态。
   * 失败返回 error：调用方会把房间滚回 WAITING 并删掉 Avalon Redis 状态。
   */
  private async initializeAvalonGame(
    room: RoomInfo,
    assignments: RoleAssignment[],
  ): Promise<{ error: string } | void> {
    if (!this.avalonGameInitializer) {
      this.logger.warn(`Avalon game initializer not registered, skipping game-state init for room ${room.code}`);
      return { error: 'Avalon 游戏状态初始化失败' };
    }

    try {
      const players = await this.getPlayers(room.code);
      const config = buildAvalonGameConfig(room.roleConfig as RoleConfig);
      await this.avalonGameInitializer.initializeGame(
        room.code,
        players.map((p) => ({
          seatNo: p.seatNo,
          userId: p.userId,
          name: p.user.nickName,
          isHost: p.userId === room.hostId,
        })),
        config,
        assignments.map((a) => ({ userId: a.userId, role: a.role as AvalonRole })),
      );
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

  async getPlayerRole(roomCode: string, userId: string): Promise<string | null> {
    const player = await this.getPlayer(roomCode, userId);
    return player?.role || null;
  }

  async markPlayerOffline(roomCode: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomCode);
    // No TTL: the marker lives until the player leaves/reconnects or the room
    // is deleted. A TTL would let a still-disconnected player "revive" as online.
    await this.redis.set(`room:${roomCode}:offline:${userId}`, Date.now().toString());
    if (room) {
      await this.prisma.room.update({
        where: { id: room.id },
        data: { updatedAt: new Date() },
      });
      await this.redis.hset(`room:${roomCode}`, 'lastActiveAt', Date.now().toString());

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
          }
        }
      }
    }
  }

  async markPlayerOnline(roomCode: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomCode);
    await this.redis.del(`room:${roomCode}:offline:${userId}`);
    if (room) {
      await this.prisma.room.update({
        where: { id: room.id },
        data: { updatedAt: new Date() },
      });
      await this.redis.hset(`room:${roomCode}`, 'lastActiveAt', Date.now().toString());
    }
  }

  async isPlayerOffline(roomCode: string, userId: string): Promise<boolean> {
    const result = await this.redis.get(`room:${roomCode}:offline:${userId}`);
    return result !== null;
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

    const updates: Partial<{ maxPlayers: number; roleConfig: RoleConfig | SgsRoleConfig; isRandomSeat: boolean }> = {};

    if (typeof data.maxPlayers !== 'undefined') {
      const playerCount = await this.getPlayerCount(roomCode);
      if (data.maxPlayers < playerCount) {
        return {
          error: `当前已有${playerCount}名玩家，无法减少至${data.maxPlayers}人`,
        };
      }
      const minForGame = room.gameType === GameType.SGS ? 2 : 5;
      const maxForGame = room.gameType === GameType.SGS ? SGS_MAX_PLAYERS : 10;
      if (data.maxPlayers < minForGame || data.maxPlayers > maxForGame) {
        return { error: `房间人数需在 ${minForGame}-${maxForGame} 人之间` };
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
          updates.roleConfig = newConfig;
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
      const targetMax = updates.maxPlayers ?? room.maxPlayers;
      if (room.gameType === GameType.SGS) {
        const mergedConfig = { ...room.roleConfig, ...data.roleConfig };
        const parseResult = SgsRoleConfigSchema.safeParse(mergedConfig);
        if (!parseResult.success) {
          const errorMessages = parseResult.error.issues.map(i => i.message).join(', ');
          return { error: 'SGS 角色配置格式无效: ' + errorMessages };
        }
        const config = parseResult.data;
        const totalRoles = config.monarch + config.loyalist + config.rebel + config.traitor;
        if (totalRoles !== targetMax) {
          return { error: `角色总数(${totalRoles})与房间人数(${targetMax})不匹配` };
        }
        updates.roleConfig = config;
      } else {
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
        if (totalRoles !== targetMax) {
          return { error: `角色总数(${totalRoles})与房间人数(${targetMax})不匹配` };
        }
        updates.roleConfig = config;
      }
    }

    if (typeof data.isRandomSeat !== 'undefined') {
      updates.isRandomSeat = data.isRandomSeat;
    }

    // If nothing to update, return current room info
    if (updates.maxPlayers === undefined && updates.roleConfig === undefined && updates.isRandomSeat === undefined) {
      const current = await this.getRoom(roomCode);
      return current as RoomInfo;
    }

    // Status guard is part of the UPDATE predicate so the earlier check and
    // the write are atomic — a concurrent startGame flip makes count 0.
    const applied = await this.prisma.room.updateMany({
      where: { id: room.id, status: 'WAITING' },
      data: updates,
    });
    if (applied.count === 0) {
      return { error: '游戏已开始，无法修改设置' };
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
          // Mirror the WebSocket leave path so online clients don't see ghost players.
          await this.eventsNotifier?.notifyClientsAfterLeave(room.code, player.userId);
        }
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
      const players = await this.getPlayers(room.code);
      const hasOnlinePlayer = players.some((p) => p.isOnline);
      if (hasOnlinePlayer) {
        // Check recent WebSocket activity (disconnect/reconnect) to distinguish
        // genuinely active rooms from stale ones with "ghost" online players.
        const lastActiveAtStr = await this.redis.hget(`room:${room.code}`, 'lastActiveAt');
        const lastActiveAt = lastActiveAtStr ? parseInt(lastActiveAtStr, 10) : null;
        if (lastActiveAt && lastActiveAt > Date.now() - idleThresholdMs) {
          this.logger.log(`Skipping idle cleanup for room ${room.code}: has online players with recent activity`);
          continue;
        }
        this.logger.log(`Deleting stale room ${room.code}: has "online" players but no activity for 1h`);
      }
      await this.prisma.roomPlayer.deleteMany({ where: { roomId: room.id } });
      await this.prisma.room.delete({ where: { id: room.id } });
      await this.redis.del(`room:${room.code}`);
      await this.redis.del(`avalon:${room.code}:state`);
      // Clean up per-player offline markers — they have no TTL by design.
      for (const player of players) {
        await this.redis.del(`room:${room.code}:offline:${player.userId}`);
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
