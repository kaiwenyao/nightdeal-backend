/**
 * 阿瓦隆游戏 WebSocket 网关
 * 处理所有游戏相关的 WebSocket 事件
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe, Logger, UseGuards, UseFilters, OnModuleInit } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { AvalonService } from './avalon.service';
import { RoomService } from '../room/room.service';
import { AuthService } from '../auth/auth.service';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { WsErrorCode } from '../common/constants/ws-error-codes';
import { RedisService } from '../redis/redis.service';
import {
  ProposeTeamDto,
  SubmitTeamVoteDto,
  SubmitQuestActionDto,
  AssassinateDto,
  GetPlayerViewDto,
  BeginGameDto,
} from './dto';
import { AvalonGameState, PlayerView, TeamVote, QuestAction, PlayerId } from './types';
import { getPlayerView } from './visibility';

const WS_RATE_LIMIT_WINDOW_MS = 1000;
const WS_RATE_LIMIT_MAX = 10;

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || false },
  namespace: '/avalon',
  allowEIO3: true,
})
@UseGuards(WsJwtGuard)
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AvalonGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(AvalonGateway.name);

  constructor(
    private avalonService: AvalonService,
    private roomService: RoomService,
    private authService: AuthService,
    private redis: RedisService,
  ) {}

  onModuleInit() {
    // 把 avalon 游戏初始化器注册进 RoomService（与 RoomEventsNotifier 同模式），
    // 避免 RoomModule 反向依赖 AvalonModule 造成模块循环依赖。
    this.roomService.setAvalonGameInitializer(this.avalonService);
  }

  async handleConnection(client: Socket) {
    const auth = (client.handshake.auth ?? {}) as { token?: string };
    const headerToken = (client.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    const token =
      (typeof auth.token === 'string' && auth.token.trim()) ||
      headerToken ||
      undefined;

    if (!token) {
      client.emit('avalon:error', { code: WsErrorCode.UNAUTHORIZED, message: '未登录' });
      client.disconnect();
      return;
    }

    let userId: string | null;
    try {
      userId = await this.authService.verifyToken(token);
    } catch {
      client.emit('avalon:error', { code: WsErrorCode.UNAUTHORIZED, message: '认证失败' });
      client.disconnect();
      return;
    }

    if (!userId) {
      client.emit('avalon:error', { code: WsErrorCode.UNAUTHORIZED, message: '登录态失效' });
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    client.join('user:' + userId);
    // 连接时还不知道 roomCode，上线标记在 avalon:join 时按房间维度完成
  }

  async handleDisconnect(client: Socket) {
    // 生命周期钩子不受 WsExceptionFilter 保护，这里兜底捕获避免未处理异常
    try {
      const userId = client.data.userId;
      if (!userId) return;

      const joinedRooms: string[] = client.data.avalonRooms ?? [];
      client.data.avalonRooms = [];
      for (const roomCode of joinedRooms) {
        await this.detachFromAvalonRoom(client, roomCode, userId);
      }
    } catch (error) {
      this.logger.error(`Error handling avalon disconnect for socket ${client.id}:`, error);
    }
  }

  private async isRateLimited(client: Socket): Promise<boolean> {
    const subject = typeof client.data?.userId === 'string' && client.data.userId
      ? `user:${client.data.userId}`
      : `socket:${client.id}`;
    const key = `ws-avalon-rate:${subject}`;

    try {
      const count = await this.redis.incrWithExpireIfFirst(
        key,
        Math.ceil(WS_RATE_LIMIT_WINDOW_MS / 1000),
      );
      return count > WS_RATE_LIMIT_MAX;
    } catch (error) {
      this.logger.error(`Failed to check rate limit for ${subject}`, error);
      return true;
    }
  }

  /** 退出 avalon 房间订阅；若该用户没有其他 socket 仍在房间内，则标记离线并广播。 */
  private async detachFromAvalonRoom(client: Socket, roomCode: string, userId: string): Promise<void> {
    client.leave(`avalon:${roomCode}`);
    try {
      const remaining = await this.server.in(`avalon:${roomCode}`).fetchSockets();
      if (remaining.some(s => s.id !== client.id && s.data?.userId === userId)) {
        return;
      }
      await this.avalonService.markPlayerOffline(roomCode, userId);
      await this.broadcastGameState(roomCode);
    } catch (error) {
      this.logger.error(`Error detaching user ${userId} from avalon room ${roomCode}:`, error);
    }
  }

  // ==================== 房间加入/离开 ====================

  /**
   * 加入游戏房间（订阅游戏状态）
   */
  @SubscribeMessage('avalon:join')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetPlayerViewDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁' });
      return;
    }

    const userId = client.data.userId;

    try {
      // 验证玩家是否在房间中
      const player = await this.roomService.getPlayer(payload.roomCode, userId);
      if (!player) {
        client.emit('avalon:error', { code: WsErrorCode.ROOM_NOT_FOUND, message: '你不在这个房间中' });
        return;
      }

      // 验证玩家是否在本局游戏状态中（否则 getPlayerView 会抛异常）
      const state = await this.avalonService.getGameState(payload.roomCode);
      if (!state) {
        client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '游戏尚未开始' });
        return;
      }
      if (!state.players.some(p => p.id === userId)) {
        client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '你不在本局游戏中' });
        return;
      }

      // 一个 socket 同时只订阅一个 avalon 房间，避免多房间广播串扰
      const joinedRooms: string[] = client.data.avalonRooms ?? [];
      for (const code of joinedRooms) {
        if (code !== payload.roomCode) {
          await this.detachFromAvalonRoom(client, code, userId);
        }
      }
      client.data.avalonRooms = [payload.roomCode];
      client.join(`avalon:${payload.roomCode}`);

      // 标记上线并广播，让其他玩家看到 isConnected 恢复
      await this.avalonService.markPlayerOnline(payload.roomCode, userId);

      // 发送当前游戏状态
      const view = await this.avalonService.getPlayerView(payload.roomCode, userId);
      if (view) {
        client.emit('avalon:state', view);
      }
    } catch (error) {
      this.logger.error(`Error handling avalon:join for user ${userId} room ${payload.roomCode}:`, error);
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '加入游戏失败，请重试' });
      return;
    }

    // broadcast 失败不应让客户端误以为加入失败：此时客户端已成功加入并收到
    // 自己的状态视图，广播只是顺带通知其他人。
    try {
      await this.broadcastGameState(payload.roomCode);
    } catch (error) {
      this.logger.error(`Failed to broadcast game state after join for room ${payload.roomCode}:`, error);
    }
  }

  /**
   * 离开游戏房间
   */
  @SubscribeMessage('avalon:leave')
  async handleLeaveGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetPlayerViewDto,
  ) {
    const userId = client.data.userId;
    const joinedRooms: string[] = client.data.avalonRooms ?? [];
    client.data.avalonRooms = joinedRooms.filter(code => code !== payload.roomCode);
    this.logger.debug(`User ${userId} left game room ${payload.roomCode}`);
    await this.detachFromAvalonRoom(client, payload.roomCode, userId);
  }

  /**
   * 开始任务阶段（房主确认身份已看完，role_reveal → team_building）
   */
  @SubscribeMessage('avalon:begin')
  async handleBegin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: BeginGameDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁' });
      return;
    }

    const userId = client.data.userId;

    try {
      const player = await this.roomService.getPlayer(payload.roomCode, userId);
      if (!player) {
        client.emit('avalon:error', { code: WsErrorCode.ROOM_NOT_FOUND, message: '你不在这个房间中' });
        return;
      }

      const result = await this.avalonService.beginGame(payload.roomCode, userId);
      if ('error' in result) {
        client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
        return;
      }

      await this.broadcastGameState(payload.roomCode);
      this.server.to(`avalon:${payload.roomCode}`).emit('avalon:phase-changed', {
        phase: result.phase,
        round: result.round,
      });
    } catch (error) {
      this.logger.error(`Error handling avalon:begin for user ${userId} room ${payload.roomCode}:`, error);
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '操作失败，请重试' });
    }
  }

  // ==================== 游戏操作 ====================

  /**
   * 提议任务队伍
   */
  @SubscribeMessage('avalon:propose-team')
  async handleProposeTeam(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ProposeTeamDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁' });
      return;
    }

    const userId = client.data.userId;

    // 验证玩家是否在房间中
    const player = await this.roomService.getPlayer(payload.roomCode, userId);
    if (!player) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_NOT_FOUND, message: '你不在这个房间中' });
      return;
    }

    const result = await this.avalonService.proposeTeam(
      payload.roomCode,
      userId,
      payload.selectedPlayerIds,
    );

    if ('error' in result) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
      return;
    }

    // 广播新状态
    await this.broadcastGameState(payload.roomCode);

    // 通知进入投票阶段
    this.server.to(`avalon:${payload.roomCode}`).emit('avalon:phase-changed', {
      phase: 'team_voting',
      proposedTeam: payload.selectedPlayerIds,
    });
  }

  /**
   * 提交组队投票
   */
  @SubscribeMessage('avalon:team-vote')
  async handleTeamVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubmitTeamVoteDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁' });
      return;
    }

    const userId = client.data.userId;

    // 验证玩家是否在房间中
    const player = await this.roomService.getPlayer(payload.roomCode, userId);
    if (!player) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_NOT_FOUND, message: '你不在这个房间中' });
      return;
    }

    const result = await this.avalonService.submitTeamVote(
      payload.roomCode,
      userId,
      payload.vote as TeamVote,
    );

    if ('error' in result) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
      return;
    }

    // 通知投票更新
    await this.broadcastVoteUpdate(payload.roomCode, userId);

    // 检查投票是否完成
    const isComplete = await this.avalonService.isTeamVoteComplete(payload.roomCode);
    if (isComplete) {
      await this.handleVoteComplete(payload.roomCode);
    }
  }

  /**
   * 处理投票完成
   */
  private async handleVoteComplete(roomCode: string) {
    const result = await this.avalonService.resolveTeamVote(roomCode);
    if ('error' in result) {
      this.logger.error(`Failed to resolve team vote for room ${roomCode}: ${result.error}`);
      return;
    }

    // 广播投票结果（匿名模式下不暴露具体投票内容）
    const state = await this.avalonService.getGameState(roomCode);
    const isPublicVote = state?.config.publicTeamVote ?? true;

    if (isPublicVote) {
      // 公开投票：发送完整结果
      this.server.to(`avalon:${roomCode}`).emit('avalon:vote-resolved', result.result);
    } else {
      // 匿名投票：只发送汇总结果，不暴露具体投票
      this.server.to(`avalon:${roomCode}`).emit('avalon:vote-resolved', {
        approved: result.result.approved,
        approvals: result.result.approvals,
        rejections: result.result.rejections,
        rejectedCount: result.result.rejectedCount,
      });
    }

    // 广播新状态
    await this.broadcastGameState(roomCode);

    // 根据结果通知阶段变化
    if (result.result.approved) {
      this.server.to(`avalon:${roomCode}`).emit('avalon:phase-changed', {
        phase: 'quest_action',
      });
    } else {
      this.server.to(`avalon:${roomCode}`).emit('avalon:phase-changed', {
        phase: 'team_building',
        rejectedCount: result.result.rejectedCount,
      });
    }
  }

  /**
   * 提交任务行动
   */
  @SubscribeMessage('avalon:quest-action')
  async handleQuestAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubmitQuestActionDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁' });
      return;
    }

    const userId = client.data.userId;

    // 验证玩家是否在房间中
    const player = await this.roomService.getPlayer(payload.roomCode, userId);
    if (!player) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_NOT_FOUND, message: '你不在这个房间中' });
      return;
    }

    const result = await this.avalonService.submitQuestAction(
      payload.roomCode,
      userId,
      payload.action as QuestAction,
    );

    if ('error' in result) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
      return;
    }

    // 通知任务行动更新（不透露是谁提交的）
    await this.broadcastQuestActionUpdate(payload.roomCode);

    // 检查任务是否完成
    const isComplete = await this.avalonService.isQuestComplete(payload.roomCode);
    if (isComplete) {
      await this.handleQuestComplete(payload.roomCode);
    }
  }

  /**
   * 处理任务完成
   */
  private async handleQuestComplete(roomCode: string) {
    const result = await this.avalonService.resolveQuest(roomCode);
    if ('error' in result) {
      this.logger.error(`Failed to resolve quest for room ${roomCode}: ${result.error}`);
      return;
    }

    // 广播任务结果
    this.server.to(`avalon:${roomCode}`).emit('avalon:quest-resolved', result.result);

    // 广播新状态
    await this.broadcastGameState(roomCode);

    // 检查游戏是否结束
    const state = await this.avalonService.getGameState(roomCode);
    if (state?.phase === 'finished') {
      this.server.to(`avalon:${roomCode}`).emit('avalon:game-finished', {
        winner: state.winner,
        reason: state.resultReason,
      });
    } else if (state?.phase === 'assassination') {
      this.server.to(`avalon:${roomCode}`).emit('avalon:phase-changed', {
        phase: 'assassination',
      });
    } else {
      this.server.to(`avalon:${roomCode}`).emit('avalon:phase-changed', {
        phase: 'team_building',
        round: state?.round,
      });
    }
  }

  /**
   * 刺杀梅林
   */
  @SubscribeMessage('avalon:assassinate')
  async handleAssassinate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AssassinateDto,
  ) {
    if (await this.isRateLimited(client)) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: '请求过于频繁' });
      return;
    }

    const userId = client.data.userId;

    // 验证玩家是否在房间中
    const player = await this.roomService.getPlayer(payload.roomCode, userId);
    if (!player) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_NOT_FOUND, message: '你不在这个房间中' });
      return;
    }

    const result = await this.avalonService.assassinate(
      payload.roomCode,
      userId,
      payload.targetPlayerId,
    );

    if ('error' in result) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_ERROR, message: result.error });
      return;
    }

    // 广播刺杀结果
    this.server.to(`avalon:${payload.roomCode}`).emit('avalon:assassination-resolved', result.result);

    // 广播最终状态
    await this.broadcastGameState(payload.roomCode);

    // 广播游戏结束
    this.server.to(`avalon:${payload.roomCode}`).emit('avalon:game-finished', {
      winner: result.result.winner,
      reason: result.result.reason,
      assassinatedPlayerId: result.result.assassinatedPlayerId,
    });
  }

  // ==================== 广播方法 ====================

  /**
   * 广播游戏状态（每个玩家只看到自己应该看到的）
   */
  async broadcastGameState(roomCode: string): Promise<void> {
    const views = await this.avalonService.getAllPlayerViews(roomCode);

    for (const [playerId, view] of views) {
      this.server.to('user:' + playerId).emit('avalon:state', view);
    }
  }

  /**
   * 广播投票更新（通知有人投票了，但不透露投了什么）
   */
  async broadcastVoteUpdate(roomCode: string, voterId: PlayerId): Promise<void> {
    const state = await this.avalonService.getGameState(roomCode);
    const isPublicVote = state?.config.publicTeamVote ?? true;

    // 匿名模式下不暴露投票者身份
    const payload = isPublicVote
      ? { voterId, message: '有玩家完成了投票' }
      : { message: '有玩家完成了投票' };

    this.server.to(`avalon:${roomCode}`).emit('avalon:vote-updated', payload);
  }

  /**
   * 广播任务行动更新（不透露是谁提交的）
   */
  async broadcastQuestActionUpdate(roomCode: string): Promise<void> {
    const state = await this.avalonService.getGameState(roomCode);
    if (!state) return;

    const actedCount = Object.keys(state.questActions).length;
    const totalRequired = state.proposedTeam.length;

    this.server.to(`avalon:${roomCode}`).emit('avalon:quest-action-updated', {
      actedCount,
      totalRequired,
      message: `${actedCount}/${totalRequired} 名队员已提交`,
    });
  }

  /**
   * 向特定玩家发送私信
   */
  sendToPlayer(playerId: string, event: string, data: unknown): void {
    this.server.to('user:' + playerId).emit(event, data);
  }

  /**
   * 向房间广播
   */
  broadcastToRoom(roomCode: string, event: string, data: unknown): void {
    this.server.to(`avalon:${roomCode}`).emit(event, data);
  }
}
