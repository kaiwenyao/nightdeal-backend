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
import { UsePipes, ValidationPipe, Logger, UseGuards, UseFilters } from '@nestjs/common';
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
export class AvalonGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(AvalonGateway.name);
  private userSocketMap = new Map<string, Set<string>>();

  constructor(
    private avalonService: AvalonService,
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

    const sockets = this.userSocketMap.get(userId) || new Set();
    sockets.add(client.id);
    this.userSocketMap.set(userId, sockets);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    const sockets = this.userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSocketMap.delete(userId);
      }
    }
  }

  private async isRateLimited(client: Socket): Promise<boolean> {
    const subject = typeof client.data?.userId === 'string' && client.data.userId
      ? `user:${client.data.userId}`
      : `socket:${client.id}`;
    const key = `ws-avalon-rate:${subject}`;

    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, Math.ceil(WS_RATE_LIMIT_WINDOW_MS / 1000));
      }
      return count > WS_RATE_LIMIT_MAX;
    } catch (error) {
      this.logger.error(`Failed to check rate limit for ${subject}`, error);
      return true;
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

    // 验证玩家是否在房间中
    const player = await this.roomService.getPlayer(payload.roomCode, userId);
    if (!player) {
      client.emit('avalon:error', { code: WsErrorCode.ROOM_NOT_FOUND, message: '你不在这个房间中' });
      return;
    }

    // 加入 Socket.IO 房间
    client.join(`avalon:${payload.roomCode}`);

    // 发送当前游戏状态
    const view = await this.avalonService.getPlayerView(payload.roomCode, userId);
    if (view) {
      client.emit('avalon:state', view);
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
    client.leave(`avalon:${payload.roomCode}`);
    this.logger.debug(`User ${userId} left game room ${payload.roomCode}`);
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
