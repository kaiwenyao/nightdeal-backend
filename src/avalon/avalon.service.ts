/**
 * 阿瓦隆游戏服务
 * 管理游戏状态和游戏流程控制
 */

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  PlayerId,
  AvalonRole,
  AvalonGameConfig,
  AvalonPlayer,
  AvalonGameState,
  TeamVote,
  QuestAction,
  TeamVoteResult,
  QuestResult,
  GameResult,
  PlayerView,
  Faction,
  DEFAULT_AVALON_CONFIG,
} from './types';
import {
  generateRoles,
  assignRoles,
  getFaction,
  createInitialState,
  proposeTeam as engineProposeTeam,
  submitTeamVote as engineSubmitTeamVote,
  resolveTeamVote as engineResolveTeamVote,
  submitQuestAction as engineSubmitQuestAction,
  resolveQuest as engineResolveQuest,
  assassinate as engineAssassinate,
  getLeaderId,
} from './game-engine';
import { getPlayerView, getTeamVoteView, getQuestActionView } from './visibility';

const GAME_STATE_TTL = 3600 * 24; // 24小时，游戏结束后状态保留一段时间供复盘，到期自动清理

@Injectable()
export class AvalonService {
  private readonly logger = new Logger(AvalonService.name);
  // 每个房间一条 Promise 链，把同一 roomCode 的写操作串行化：
  // 弱网下两名玩家同时提交最后一票时，两次 resolve 会排队执行，
  // 后到的 resolve 因引擎阶段校验失败而安全落空，不会双重计分。
  private roomChains = new Map<string, Promise<unknown>>();

  constructor(private redis: RedisService) {}

  /**
   * 串行执行同一房间的写操作
   */
  private withRoomLock<T>(roomCode: string, fn: () => Promise<T>): Promise<T> {
    const chained = (this.roomChains.get(roomCode) ?? Promise.resolve()).then(fn);
    // 链上挂一个吞掉错误的续链，保证一次失败不会卡死后续所有操作
    this.roomChains.set(roomCode, chained.catch(() => undefined));
    return chained;
  }

  // ==================== 游戏状态管理 ====================

  /**
   * 获取游戏状态
   */
  async getGameState(roomCode: string): Promise<AvalonGameState | null> {
    const data = await this.redis.get(`avalon:${roomCode}:state`);
    if (!data) return null;
    return JSON.parse(data) as AvalonGameState;
  }

  /**
   * 保存游戏状态
   */
  async saveGameState(roomCode: string, state: AvalonGameState): Promise<void> {
    await this.redis.set(
      `avalon:${roomCode}:state`,
      JSON.stringify(state),
      GAME_STATE_TTL,
    );
  }

  /**
   * 删除游戏状态
   */
  async deleteGameState(roomCode: string): Promise<void> {
    await this.redis.del(`avalon:${roomCode}:state`);
  }

  // ==================== 游戏初始化 ====================

  /**
   * 初始化游戏
   * @param roomCode 房间号
   * @param players 玩家列表
   * @param config 游戏配置
   * @param precomputedAssignments 预先计算好的角色分配（如 startGame 事务内已持久化的分配）。
   *        传入后跳过随机分配，保证 Redis 游戏状态与 DB 中的 roomPlayer.role 一致。
   * @returns 每个玩家的角色分配（用于私信发送）
   */
  async initializeGame(
    roomCode: string,
    players: { seatNo: number; userId: string; name: string; isHost: boolean }[],
    config: AvalonGameConfig,
    precomputedAssignments?: { userId: string; role: AvalonRole }[],
  ): Promise<Map<PlayerId, { role: AvalonRole; faction: Faction }>> {
    return this.withRoomLock(roomCode, async () => {
      let assignments: { seatNo: number; userId: string; role: AvalonRole; faction: Faction }[];

      if (precomputedAssignments) {
        assignments = players.map(p => {
          const found = precomputedAssignments.find(a => a.userId === p.userId);
          if (!found) {
            throw new Error(`缺少玩家 ${p.userId} 的角色分配`);
          }
          return {
            seatNo: p.seatNo,
            userId: p.userId,
            role: found.role,
            faction: getFaction(found.role),
          };
        });
      } else {
        // 生成角色（含 Merlin/Assassin 必需校验，配置非法时抛错拒绝开局）
        const roles = generateRoles(players.length, config);

        // 分配角色
        assignments = assignRoles(
          players.map(p => ({ seatNo: p.seatNo, userId: p.userId })),
          roles,
        );
      }

      // 构建玩家列表
      const avalonPlayers: AvalonPlayer[] = assignments.map((assignment, index) => ({
        id: assignment.userId,
        name: players[index].name,
        seatNo: assignment.seatNo,
        isHost: players[index].isHost,
        isConnected: true,
        role: assignment.role,
        faction: assignment.faction,
      }));

      // 创建初始状态
      const state = createInitialState(roomCode, avalonPlayers, config);

      // 找到刺客和梅林
      const assassin = avalonPlayers.find(p => p.role === 'Assassin');
      const merlin = avalonPlayers.find(p => p.role === 'Merlin');

      if (assassin) {
        state.assassinId = assassin.id;
      }
      if (merlin) {
        state.merlinId = merlin.id;
      }

      // 保存状态
      await this.saveGameState(roomCode, state);

      // 返回角色分配结果
      const roleAssignments = new Map<PlayerId, { role: AvalonRole; faction: Faction }>();
      for (const assignment of assignments) {
        roleAssignments.set(assignment.userId, {
          role: assignment.role,
          faction: assignment.faction,
        });
      }

      this.logger.log(`Game initialized for room ${roomCode}: ${players.length} players`);
      return roleAssignments;
    });
  }

  /**
   * 开始任务阶段：房主确认身份已看完后，把游戏从 role_reveal 推进到 team_building
   */
  async beginGame(
    roomCode: string,
    hostId: PlayerId,
  ): Promise<{ success: true } | { error: string }> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return { error: '游戏不存在' };
      if (state.phase !== 'role_reveal') return { error: '当前不是身份揭示阶段' };

      const host = state.players.find(p => p.id === hostId);
      if (!host || !host.isHost) return { error: '仅房主可以开始任务阶段' };

      await this.saveGameState(roomCode, { ...state, phase: 'team_building' });
      this.logger.log(`Room ${roomCode} advanced to team_building by host ${hostId}`);
      return { success: true };
    });
  }

  // ==================== 游戏操作 ====================

  /**
   * 获取玩家视角
   */
  async getPlayerView(roomCode: string, playerId: PlayerId): Promise<PlayerView | null> {
    const state = await this.getGameState(roomCode);
    if (!state) return null;
    return getPlayerView(state, playerId);
  }

  /**
   * 获取所有玩家的视角
   */
  async getAllPlayerViews(roomCode: string): Promise<Map<PlayerId, PlayerView>> {
    const state = await this.getGameState(roomCode);
    if (!state) return new Map();

    const views = new Map<PlayerId, PlayerView>();
    for (const player of state.players) {
      views.set(player.id, getPlayerView(state, player.id));
    }
    return views;
  }

  /**
   * 提议任务队伍
   */
  async proposeTeam(
    roomCode: string,
    leaderId: PlayerId,
    selectedPlayerIds: PlayerId[],
  ): Promise<{ success: true } | { error: string }> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return { error: '游戏不存在' };

      try {
        const newState = engineProposeTeam(state, leaderId, selectedPlayerIds);
        await this.saveGameState(roomCode, newState);
        return { success: true };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
  }

  /**
   * 提交组队投票
   */
  async submitTeamVote(
    roomCode: string,
    playerId: PlayerId,
    vote: TeamVote,
  ): Promise<{ success: true } | { error: string }> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return { error: '游戏不存在' };

      try {
        const newState = engineSubmitTeamVote(state, playerId, vote);
        await this.saveGameState(roomCode, newState);
        return { success: true };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
  }

  /**
   * 解析组队投票
   */
  async resolveTeamVote(
    roomCode: string,
  ): Promise<{ result: TeamVoteResult; views: Map<PlayerId, PlayerView> } | { error: string }> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return { error: '游戏不存在' };

      try {
        const { result, newState } = engineResolveTeamVote(state);
        await this.saveGameState(roomCode, newState);

        // 获取所有玩家视角
        const views = new Map<PlayerId, PlayerView>();
        for (const player of newState.players) {
          views.set(player.id, getPlayerView(newState, player.id));
        }

        return { result, views };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
  }

  /**
   * 提交任务行动
   */
  async submitQuestAction(
    roomCode: string,
    playerId: PlayerId,
    action: QuestAction,
  ): Promise<{ success: true } | { error: string }> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return { error: '游戏不存在' };

      try {
        const newState = engineSubmitQuestAction(state, playerId, action);
        await this.saveGameState(roomCode, newState);
        return { success: true };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
  }

  /**
   * 解析任务结果
   */
  async resolveQuest(
    roomCode: string,
  ): Promise<{ result: QuestResult; views: Map<PlayerId, PlayerView> } | { error: string }> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return { error: '游戏不存在' };

      try {
        const { result, newState } = engineResolveQuest(state);
        await this.saveGameState(roomCode, newState);

        // 获取所有玩家视角
        const views = new Map<PlayerId, PlayerView>();
        for (const player of newState.players) {
          views.set(player.id, getPlayerView(newState, player.id));
        }

        return { result, views };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
  }

  /**
   * 刺杀梅林
   */
  async assassinate(
    roomCode: string,
    assassinId: PlayerId,
    targetPlayerId: PlayerId,
  ): Promise<{ result: GameResult; views: Map<PlayerId, PlayerView> } | { error: string }> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return { error: '游戏不存在' };

      try {
        const { result, newState } = engineAssassinate(state, assassinId, targetPlayerId);
        await this.saveGameState(roomCode, newState);

        // 获取所有玩家视角
        const views = new Map<PlayerId, PlayerView>();
        for (const player of newState.players) {
          views.set(player.id, getPlayerView(newState, player.id));
        }

        return { result, views };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
  }

  /**
   * 获取投票视图
   */
  async getTeamVoteView(
    roomCode: string,
    playerId: PlayerId,
  ): Promise<Record<PlayerId, TeamVote | 'unknown'> | null> {
    const state = await this.getGameState(roomCode);
    if (!state) return null;
    return getTeamVoteView(state, playerId);
  }

  /**
   * 获取任务行动视图
   */
  async getQuestActionView(
    roomCode: string,
    playerId: PlayerId,
  ): Promise<{ successCount: number; failCount: number; totalRequired: number } | null> {
    const state = await this.getGameState(roomCode);
    if (!state) return null;
    return getQuestActionView(state, playerId);
  }

  /**
   * 检查投票是否完成
   */
  async isTeamVoteComplete(roomCode: string): Promise<boolean> {
    const state = await this.getGameState(roomCode);
    if (!state) return false;
    return Object.keys(state.teamVotes).length === state.players.length;
  }

  /**
   * 检查任务是否完成
   */
  async isQuestComplete(roomCode: string): Promise<boolean> {
    const state = await this.getGameState(roomCode);
    if (!state) return false;
    return Object.keys(state.questActions).length === state.proposedTeam.length;
  }

  /**
   * 获取当前队长 ID
   */
  async getCurrentLeaderId(roomCode: string): Promise<PlayerId | null> {
    const state = await this.getGameState(roomCode);
    if (!state) return null;
    return getLeaderId(state);
  }

  /**
   * 标记玩家掉线
   */
  async markPlayerOffline(roomCode: string, playerId: PlayerId): Promise<void> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return;

      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, isConnected: false } : p,
      );

      await this.saveGameState(roomCode, { ...state, players: updatedPlayers });
    });
  }

  /**
   * 标记玩家上线
   */
  async markPlayerOnline(roomCode: string, playerId: PlayerId): Promise<void> {
    return this.withRoomLock(roomCode, async () => {
      const state = await this.getGameState(roomCode);
      if (!state) return;

      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, isConnected: true } : p,
      );

      await this.saveGameState(roomCode, { ...state, players: updatedPlayers });
    });
  }
}

