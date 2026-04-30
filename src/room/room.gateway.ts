import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { AuthService } from '../auth/auth.service';
import { JoinRoomDto, LeaveRoomDto, StartGameDto, KickPlayerDto, UpdatePlayerDto } from './dto';

const OFFLINE_TIMEOUT_MS = 5 * 60 * 1000;

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || '*' },
  namespace: '/room',
  allowEIO3: true,
})
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);
  private userSocketMap = new Map<string, string>();

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
    this.userSocketMap.set(userId, client.id);
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
      const isOffline = await this.roomService.isPlayerOffline(payload.roomCode, userId);
      if (isOffline) {
        await this.roomService.markPlayerOnline(payload.roomCode, userId);
        client.join(payload.roomCode);
        const players = await this.roomService.getPlayers(payload.roomCode);
        client.emit('room:state', { room, players });
        if (room.status === 'PLAYING' && existingPlayer.role) {
          client.emit('room:started', { yourRole: existingPlayer.role });
        }
        client.to(payload.roomCode).emit('room:reconnected', { userId });
        return;
      }
      client.emit('room:error', { message: '你已在房间中' });
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

    client.join(payload.roomCode);
    client.emit('room:state', result.roomState);
    client.to(payload.roomCode).emit('room:player-joined', {
      player: result.player,
      playerCount: result.playerCount,
    });
  }

  @SubscribeMessage('room:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomDto,
  ) {
    const userId = client.data.userId;
    await this.roomService.leaveRoom(payload.roomCode, userId);
    client.leave(payload.roomCode);
    client.to(payload.roomCode).emit('room:player-left', {
      userId,
      playerCount: await this.roomService.getPlayerCount(payload.roomCode),
    });
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

    const targetSocketId = this.userSocketMap.get(payload.targetUserId);
    if (targetSocketId) {
      const targetSocket = this.server.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('room:error', { message: '你已被房主踢出房间' });
        targetSocket.leave(payload.roomCode);
      }
    }

    client.to(payload.roomCode).emit('room:player-left', {
      userId: payload.targetUserId,
      playerCount: await this.roomService.getPlayerCount(payload.roomCode),
    });
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
      const socketId = this.userSocketMap.get(assignment.userId);
      if (socketId) {
        const target = this.server.sockets.sockets.get(socketId);
        target?.emit('room:started', { yourRole: assignment.role });
      }
    }
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

    this.userSocketMap.delete(userId);

    const rooms = await this.roomService.getUserRooms(userId);

    for (const roomCode of rooms) {
      await this.roomService.markPlayerOffline(roomCode, userId);
      client.to(roomCode).emit('room:offline', { userId });

      setTimeout(async () => {
        try {
          const isOffline = await this.roomService.isPlayerOffline(roomCode, userId);
          if (isOffline) {
            await this.roomService.leaveRoom(roomCode, userId);
            this.server.to(roomCode).emit('room:player-left', {
              userId,
              playerCount: await this.roomService.getPlayerCount(roomCode),
            });
          }
        } catch (error) {
          this.logger.error(`Error cleaning up offline player ${userId} from room ${roomCode}:`, error);
        }
      }, OFFLINE_TIMEOUT_MS);
    }
  }
}
