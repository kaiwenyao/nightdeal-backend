import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { UsePipes, ValidationPipe, Logger, UseGuards, UseFilters } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService, RoomInfo } from './room.service';
import { AuthService } from '../auth/auth.service';
import { JoinRoomDto, LeaveRoomDto, StartGameDto, KickPlayerDto, UpdatePlayerDto, SettingsUpdateDto } from './dto';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';

const OFFLINE_TIMEOUT_MS = 5 * 60 * 1000;

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || '*' },
  namespace: '/room',
  allowEIO3: true,
})
@UseGuards(WsJwtGuard)
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);
  private userSocketMap = new Map<string, Set<string>>();

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    const authToken = client.handshake.auth?.token;
    const queryTokenRaw = client.handshake.query?.token;
    const queryToken = Array.isArray(queryTokenRaw) ? queryTokenRaw[0] : queryTokenRaw;
    const token =
      (typeof authToken === 'string' && authToken.trim()) ||
      (typeof queryToken === 'string' && queryToken.trim()) ||
      undefined;
    if (!token) {
      client.emit('room:error', { message: '未登录' });
      client.disconnect();
      return;
    }
    const userId = await this.authService.verifyToken(token);
    if (!userId) {
      client.emit('room:error', { message: '登录态失效' });
      client.disconnect();
      return;
    }
    client.data.userId = userId;
    const sockets = this.userSocketMap.get(userId) || new Set();
    sockets.add(client.id);
    this.userSocketMap.set(userId, sockets);
  }

  @SubscribeMessage('room:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    const userId = client.data.userId;

    const room = await this.roomService.getRoom(payload.roomCode);
    if (!room) {
      client.emit('room:error', { message: '房间不存在' });
      return;
    }

    if (room.status === 'FINISHED') {
      client.emit('room:error', { message: '房间已结束' });
      return;
    }

    const existingPlayer = await this.roomService.getPlayer(payload.roomCode, userId);
    if (existingPlayer) {
      client.join(payload.roomCode);

      const isOffline = await this.roomService.isPlayerOffline(payload.roomCode, userId);
      if (isOffline) {
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
      client.emit('room:error', { message: '游戏已开始，无法加入' });
      return;
    }

    const playerCount = await this.roomService.getPlayerCount(payload.roomCode);
    if (playerCount >= room.maxPlayers) {
      client.emit('room:error', { message: '房间已满' });
      return;
    }

    const result = await this.roomService.joinRoom(payload.roomCode, userId);

    if ('error' in result) {
      client.emit('room:error', { message: result.error });
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
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(roomCode);
      }
    }
  }

  @SubscribeMessage('room:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomDto,
  ) {
    const userId = client.data.userId;
    await this.roomService.leaveRoom(payload.roomCode, userId);

    this.evictUserFromRoom(userId, payload.roomCode);

    // Emit player-left event to all remaining clients in the room
    const playerCount = await this.roomService.getPlayerCount(payload.roomCode);
    client.to(payload.roomCode).emit('room:player-left', {
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
    const userId = client.data.userId;
    const result = await this.roomService.kickPlayer(
      payload.roomCode,
      userId,
      payload.targetUserId,
    );

    if ('error' in result) {
      client.emit('room:error', { message: result.error });
      return;
    }

    const targetSocketIds = this.userSocketMap.get(payload.targetUserId);
    if (targetSocketIds) {
      for (const targetSocketId of targetSocketIds) {
        const targetSocket = this.server.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit('room:error', { message: '你已被房主踢出房间' });
          targetSocket.leave(payload.roomCode);
        }
      }
    }

    // Emit player-left event to all remaining clients in the room
    const playerCount = await this.roomService.getPlayerCount(payload.roomCode);
    client.to(payload.roomCode).emit('room:player-left', {
      userId: payload.targetUserId,
      playerCount,
    });

    await this.broadcastRoomState(payload.roomCode);
  }

  @SubscribeMessage('room:start')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartGameDto,
  ) {
    const userId = client.data.userId;
    const result = await this.roomService.startGame(payload.roomCode, userId);

    if ('error' in result) {
      client.emit('room:error', { message: result.error });
      return;
    }

    for (const assignment of result.assignments) {
      const socketIds = this.userSocketMap.get(assignment.userId);
      if (socketIds) {
        for (const socketId of socketIds) {
          const target = this.server.sockets.sockets.get(socketId);
          target?.emit('room:started', { yourRole: assignment.role });
        }
      }
    }
  }

  @SubscribeMessage('room:settings-update')
  async handleSettingsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SettingsUpdateDto,
  ) {
    const userId = client.data.userId;
    const result = await this.roomService.updateRoomSettings(payload.roomCode, userId, {
      maxPlayers: payload.maxPlayers,
      roleConfig: payload.roleConfig,
    });

    if (typeof result === 'object' && 'error' in result) {
      client.emit('room:error', { message: (result as { error: string }).error });
      return;
    }

    // Broadcast to all room members including sender
    const maxPlayers = (result as RoomInfo).maxPlayers;
    const roleConfig = (result as RoomInfo).roleConfig;
    client.to(payload.roomCode).emit('room:settings-updated', { maxPlayers, roleConfig });
    client.emit('room:settings-updated', { maxPlayers, roleConfig });
    await this.broadcastRoomState(payload.roomCode);
  }

  @SubscribeMessage('player:update')
  async handlePlayerUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdatePlayerDto,
  ) {
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
          client.to(roomCode).emit('room:offline', { userId });

          setTimeout(async () => {
            try {
              const isOffline = await this.roomService.isPlayerOffline(roomCode, userId);
              if (isOffline) {
                await this.roomService.leaveRoom(roomCode, userId);
                const playerCount = await this.roomService.getPlayerCount(roomCode);
                this.server.to(roomCode).emit('room:player-left', {
                  userId,
                  playerCount,
                });
                await this.broadcastRoomState(roomCode);
              }
            } catch (error) {
              this.logger.error(`Error cleaning up offline player ${userId} from room ${roomCode}:`, error);
            }
          }, OFFLINE_TIMEOUT_MS);
        }
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
    const roomSockets = this.server.sockets.adapter.rooms.get(roomCode);
    const socketCount = roomSockets ? roomSockets.size : 0;
    this.logger.debug(`Broadcasting room:state to ${socketCount} clients in room ${roomCode}`);
    this.server.to(roomCode).emit('room:state', { room, players });
  }
}
