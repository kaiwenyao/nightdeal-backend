import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { UsePipes, ValidationPipe, Logger, UseGuards, UseFilters } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { RoomService, RoomInfo } from './room.service';
import { AuthService } from '../auth/auth.service';
import { JoinRoomDto, LeaveRoomDto, StartGameDto, KickPlayerDto, UpdatePlayerDto, SettingsUpdateDto } from './dto';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { WsErrorCode } from '../common/constants/ws-error-codes';
import { RedisService } from '../redis/redis.service';

const OFFLINE_TIMEOUT_MS = 5 * 60 * 1000;
const WS_RATE_LIMIT_WINDOW_MS = 1000;
const WS_RATE_LIMIT_MAX = 10;

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || false },
  namespace: '/room',
  allowEIO3: true,
})
@UseGuards(WsJwtGuard)
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(RoomGateway.name);
  private userSocketMap = new Map<string, Set<string>>();
  private offlineTimeouts = new Map<string, Map<string, NodeJS.Timeout>>();

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    const auth = (client.handshake.auth ?? {}) as { token?: string };
    const headerToken = (client.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    const token =
      (typeof auth.token === 'string' && auth.token.trim()) ||
      headerToken ||
      undefined;
    if (!token) {
      client.emit('room:error', { code: WsErrorCode.UNAUTHORIZED, message: '未登录' });
      client.disconnect();
      return;
    }
    let userId: string | null;
    try {
      userId = await this.authService.verifyToken(token);
    } catch {
      client.emit('room:error', { code: WsErrorCode.UNAUTHORIZED, message: '认证失败' });
      client.disconnect();
      return;
    }
    if (!userId) {
      client.emit('room:error', { code: WsErrorCode.TOKEN_EXPIRED, message: '登录态失效' });
      client.disconnect();
      return;
    }
    client.data.userId = userId;
    client.join('user:' + userId);
    const sockets = this.userSocketMap.get(userId) || new Set();
    sockets.add(client.id);
    this.userSocketMap.set(userId, sockets);
  }

  private async isRateLimited(client: Socket): Promise<boolean> {
    const subject = typeof client.data?.userId === 'string' && client.data.userId
      ? `user:${client.data.userId}`
      : `socket:${client.id}`;
    const key = `ws-rate:${subject}`;

    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, Math.ceil(WS_RATE_LIMIT_WINDOW_MS / 1000));
      }
      return count > WS_RATE_LIMIT_MAX;
    } catch (error) {
      this.logger.error(`Failed to check WebSocket rate limit for ${subject}`, error);
      return true;
    }
  }

  @SubscribeMessage('room:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁，请稍后再试' });
      return;
    }
    const userId = client.data.userId;

    const room = await this.roomService.getRoom(payload.roomCode);
    if (!room) {
      client.emit('room:error', { code: WsErrorCode.ROOM_NOT_FOUND, message: '房间不存在' });
      return;
    }

    const existingPlayer = await this.roomService.getPlayer(payload.roomCode, userId);
    if (existingPlayer) {
      client.join(payload.roomCode);

      const isOffline = await this.roomService.isPlayerOffline(payload.roomCode, userId);
      if (isOffline) {
        // Cancel pending offline cleanup timeout since the player reconnected
        this.clearOfflineTimeout(userId, payload.roomCode);
        await this.roomService.markPlayerOnline(payload.roomCode, userId);
        await this.broadcastRoomState(payload.roomCode);
        if (room.status === 'PLAYING' && existingPlayer.role) {
          client.emit('room:started', { yourRole: existingPlayer.role });
        }
        this.server.to(payload.roomCode).emit('room:reconnected', { userId });
        return;
      }

      await this.broadcastRoomState(payload.roomCode);
      if (room.status === 'PLAYING' && existingPlayer.role) {
        client.emit('room:started', { yourRole: existingPlayer.role });
      }
      return;
    }

    if (room.status === 'PLAYING') {
      client.emit('room:error', { code: WsErrorCode.GAME_ALREADY_STARTED, message: '游戏已开始，无法加入' });
      return;
    }

    const playerCount = await this.roomService.getPlayerCount(payload.roomCode);
    if (playerCount >= room.maxPlayers) {
      client.emit('room:error', { code: WsErrorCode.ROOM_FULL, message: '房间已满' });
      return;
    }

    const result = await this.roomService.joinRoom(payload.roomCode, userId);

    if ('error' in result) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
      return;
    }

    this.logger.debug(`New player ${userId} joined room ${payload.roomCode}`);
    client.join(payload.roomCode);
    await this.broadcastRoomState(payload.roomCode);

    // Emit player-joined event to all OTHER clients in the room for immediate UI update
    const newPlayer = result.player;
    const playerCountAfter = await this.roomService.getPlayerCount(payload.roomCode);
    this.logger.debug(`Emitting room:player-joined for user ${userId} to room ${payload.roomCode}`);
    client.to(payload.roomCode).emit('room:player-joined', {
      player: newPlayer,
      playerCount: playerCountAfter,
    });
  }

  /**
   * Remove all Socket.IO connections for a user from a room (e.g. HTTP /leave
   * while WebSocket is still connected). Used by handleLeave and RoomController.
   */
  evictUserFromRoom(userId: string, roomCode: string): void {
    const userSockets = this.userSocketMap.get(userId);
    if (!userSockets) return;
    for (const socketId of userSockets) {
      const socket = this.server.sockets.get(socketId);
      if (socket) {
        socket.leave(roomCode);
      }
    }
  }

  /** After host ends game (WebSocket or HTTP): full room state then room:ended. */
  async notifyClientsAfterEnd(roomCode: string): Promise<void> {
    await this.broadcastRoomState(roomCode);
    this.server.to(roomCode).emit('room:ended', { status: 'WAITING' });
  }

  /** After settings update (WebSocket or HTTP): settings payload then full room state. */
  async notifyClientsAfterSettingsUpdate(
    roomCode: string,
    maxPlayers: number,
    roleConfig: RoomInfo['roleConfig'],
  ): Promise<void> {
    this.server.to(roomCode).emit('room:settings-updated', { maxPlayers, roleConfig });
    await this.broadcastRoomState(roomCode);
  }

  /** After start succeeds (WebSocket or HTTP): per-player roles + full room state. */
  async notifyClientsAfterStart(
    roomCode: string,
    assignments: { userId: string; role: string }[],
  ): Promise<void> {
    for (const assignment of assignments) {
      this.server.to('user:' + assignment.userId).emit('room:started', { yourRole: assignment.role });
    }

    await this.broadcastRoomState(roomCode);
  }

  /**
   * After DB kick succeeds (via WebSocket or HTTP): notify kicked sockets,
   * broadcast player-left + room state to remaining clients.
   */
  async notifyClientsAfterKick(roomCode: string, targetUserId: string): Promise<void> {
    const targetSocketIds = this.userSocketMap.get(targetUserId);
    if (targetSocketIds) {
      for (const targetSocketId of targetSocketIds) {
        const targetSocket = this.server.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit('room:error', {
            code: WsErrorCode.KICKED,
            message: '你已被房主踢出房间',
          });
          targetSocket.leave(roomCode);
        }
      }
    }

    const playerCount = await this.roomService.getPlayerCount(roomCode);
    this.server.to(roomCode).emit('room:player-left', {
      userId: targetUserId,
      playerCount,
    });

    await this.broadcastRoomState(roomCode);
  }

  @SubscribeMessage('room:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁，请稍后再试' });
      return;
    }
    const userId = client.data.userId;
    await this.roomService.leaveRoom(payload.roomCode, userId);

    this.evictUserFromRoom(userId, payload.roomCode);

    // Emit player-left event to all remaining clients in the room
    const playerCount = await this.roomService.getPlayerCount(payload.roomCode);
    this.server.to(payload.roomCode).emit('room:player-left', {
      userId,
      playerCount,
    });

    await this.broadcastRoomState(payload.roomCode);
  }

  @SubscribeMessage('room:kick')
  async handleKick(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: KickPlayerDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁，请稍后再试' });
      return;
    }
    const userId = client.data.userId;
    const result = await this.roomService.kickPlayer(
      payload.roomCode,
      userId,
      payload.targetUserId,
    );

    if ('error' in result) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
      return;
    }

    await this.notifyClientsAfterKick(payload.roomCode, payload.targetUserId);
  }

  @SubscribeMessage('room:start')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartGameDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁，请稍后再试' });
      return;
    }
    const userId = client.data.userId;
    const result = await this.roomService.startGame(payload.roomCode, userId);

    if ('error' in result) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
      return;
    }

    await this.notifyClientsAfterStart(payload.roomCode, result.assignments);
  }

  @SubscribeMessage('room:end')
  async handleEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartGameDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁，请稍后再试' });
      return;
    }
    const userId = client.data.userId;
    const result = await this.roomService.endGame(payload.roomCode, userId);

    if ('error' in result) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
      return;
    }

    await this.notifyClientsAfterEnd(payload.roomCode);
  }

  @SubscribeMessage('room:settings-update')
  async handleSettingsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SettingsUpdateDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁，请稍后再试' });
      return;
    }
    const userId = client.data.userId;
    const result = await this.roomService.updateRoomSettings(payload.roomCode, userId, {
      maxPlayers: payload.maxPlayers,
      roleConfig: payload.roleConfig,
    });

    if (typeof result === 'object' && 'error' in result) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: (result as { error: string }).error });
      return;
    }

    const updated = result as RoomInfo;
    await this.notifyClientsAfterSettingsUpdate(
      payload.roomCode,
      updated.maxPlayers,
      updated.roleConfig,
    );
  }

  @SubscribeMessage('player:update')
  async handlePlayerUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdatePlayerDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('room:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁，请稍后再试' });
      return;
    }
    const userId = client.data.userId;
    await this.roomService.updatePlayerInfo(userId, payload);

    const rooms = await this.roomService.getUserRooms(userId);
    for (const roomCode of rooms) {
      client.to(roomCode).emit('player:updated', {
        userId,
        nickName: payload.nickName,
        avatarUrl: payload.avatarUrl,
      });
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    const sockets = this.userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSocketMap.delete(userId);

        // Only mark offline and schedule cleanup when ALL devices are disconnected
        const rooms = await this.roomService.getUserRooms(userId);

        for (const roomCode of rooms) {
          await this.roomService.markPlayerOffline(roomCode, userId);
          this.server.to(roomCode).emit('room:offline', { userId });

          const timeout = setTimeout(async () => {
            try {
              this.clearOfflineTimeout(userId, roomCode);
              // Re-check: if the player reconnected and the offline marker was
              // cleared by handleJoin(), skip cleanup to avoid a race condition.
              const stillOffline = await this.roomService.isPlayerOffline(roomCode, userId);
              if (!stillOffline) {
                return;
              }
              const room = await this.roomService.getRoom(roomCode);
              if (room && room.status === 'PLAYING') {
                return;
              }
              // Re-check once more before the destructive leaveRoom():
              // the player may have reconnected while getRoom() was awaited.
              const stillOfflineBeforeLeave = await this.roomService.isPlayerOffline(roomCode, userId);
              if (!stillOfflineBeforeLeave) {
                return;
              }
              await this.roomService.leaveRoom(roomCode, userId);
              const playerCount = await this.roomService.getPlayerCount(roomCode);
              this.server.to(roomCode).emit('room:player-left', {
                userId,
                playerCount,
              });
              await this.broadcastRoomState(roomCode);
            } catch (error) {
              this.logger.error(`Error cleaning up offline player ${userId} from room ${roomCode}:`, error);
            }
          }, OFFLINE_TIMEOUT_MS);

          this.setOfflineTimeout(userId, roomCode, timeout);
        }
      }
    }
  }

  private setOfflineTimeout(userId: string, roomCode: string, timeout: NodeJS.Timeout): void {
    let userMap = this.offlineTimeouts.get(userId);
    if (!userMap) {
      userMap = new Map();
      this.offlineTimeouts.set(userId, userMap);
    }
    userMap.set(roomCode, timeout);
  }

  private clearOfflineTimeout(userId: string, roomCode: string): void {
    const userMap = this.offlineTimeouts.get(userId);
    if (!userMap) return;
    const timeout = userMap.get(roomCode);
    if (timeout) {
      clearTimeout(timeout);
      userMap.delete(roomCode);
      if (userMap.size === 0) {
        this.offlineTimeouts.delete(userId);
      }
    }
  }

  async broadcastRoomState(roomCode: string): Promise<void> {
    const room = await this.roomService.getRoom(roomCode);
    if (!room) {
      this.logger.warn(`Cannot broadcast room state: room ${roomCode} not found`);
      return;
    }
    const players = await this.roomService.getPlayers(roomCode);
    // Strip role from players before broadcasting — roles are delivered
    // privately via room:started { yourRole } to prevent information leak.
    const safePlayers = players.map(({ role, ...rest }) => rest);
    const roomSockets = this.server.adapter.rooms?.get(roomCode);
    const socketCount = roomSockets ? roomSockets.size : 0;
    this.logger.debug(`Broadcasting room:state to ${socketCount} clients in room ${roomCode}`);
    this.server.to(roomCode).emit('room:state', { room, players: safePlayers });
  }
}
