/**
 * 阿瓦隆游戏引擎
 * 包含所有游戏核心逻辑的纯函数实现
 */

import { randomInt } from 'node:crypto';
import {
  PlayerId,
  Faction,
  AvalonRole,
  GamePhase,
  TeamVote,
  QuestAction,
  Winner,
  ResultReason,
  AvalonGameConfig,
  AvalonPlayer,
  QuestConfig,
  QuestHistoryItem,
  TeamVoteResult,
  QuestResult,
  GameResult,
  AvalonGameState,
  QUEST_CONFIGS,
  FACTION_COUNTS,
} from './types';

// ==================== 角色分配 ====================

/**
 * 根据玩家人数和配置生成角色池
 * @param playerCount 玩家数量 (5-10)
 * @param config 游戏配置
 * @returns 角色列表
 */
export function generateRoles(
  playerCount: number,
  config: AvalonGameConfig,
): AvalonRole[] {
  if (playerCount < 5 || playerCount > 10) {
    throw new Error('玩家人数必须在 5-10 人之间');
  }

  const factionCount = FACTION_COUNTS[playerCount];
  if (!factionCount) {
    throw new Error(`不支持 ${playerCount} 人游戏`);
  }

  const { good: goodCount, evil: evilCount } = factionCount;

  // 从配置中获取启用的角色
  const enabledRoles = config.roles;

  // 分离好人和邪恶角色
  const goodRoles: AvalonRole[] = [];
  const evilRoles: AvalonRole[] = [];

  for (const role of enabledRoles) {
    if (isGoodRole(role)) {
      goodRoles.push(role);
    } else {
      evilRoles.push(role);
    }
  }

  // 验证角色数量
  if (goodRoles.length > goodCount) {
    throw new Error(`好人角色数量(${goodRoles.length})超过好人数量(${goodCount})`);
  }
  if (evilRoles.length > evilCount) {
    throw new Error(`邪恶角色数量(${evilRoles.length})超过邪恶数量(${evilCount})`);
  }

  // 构建最终角色池
  const rolePool: AvalonRole[] = [];

  // 添加特殊角色
  rolePool.push(...goodRoles);
  rolePool.push(...evilRoles);

  // 填充忠臣
  const loyalServantCount = goodCount - goodRoles.length;
  for (let i = 0; i < loyalServantCount; i++) {
    rolePool.push('LoyalServant');
  }

  // 填充爪牙
  const minionCount = evilCount - evilRoles.length;
  for (let i = 0; i < minionCount; i++) {
    rolePool.push('Minion');
  }

  // 验证总数
  if (rolePool.length !== playerCount) {
    throw new Error(`角色总数(${rolePool.length})与玩家数量(${playerCount})不匹配`);
  }

  return rolePool;
}

/**
 * 将角色分配给玩家（洗牌）
 * @param players 玩家列表
 * @param roles 角色列表
 * @returns 分配结果
 */
export function assignRoles(
  players: { seatNo: number; userId: string }[],
  roles: AvalonRole[],
): { seatNo: number; userId: string; role: AvalonRole; faction: Faction }[] {
  if (players.length !== roles.length) {
    throw new Error('玩家数量与角色数量不匹配');
  }

  // Fisher-Yates 洗牌（使用加密安全的随机数）
  const shuffledRoles = [...roles];
  for (let i = shuffledRoles.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
  }

  return players.map((player, index) => ({
    seatNo: player.seatNo,
    userId: player.userId,
    role: shuffledRoles[index],
    faction: getFaction(shuffledRoles[index]),
  }));
}

/**
 * 获取角色所属阵营
 * @param role 角色
 * @returns 阵营
 */
export function getFaction(role: AvalonRole): Faction {
  switch (role) {
    case 'Merlin':
    case 'Percival':
    case 'LoyalServant':
      return 'good';
    case 'Assassin':
    case 'Morgana':
    case 'Mordred':
    case 'Oberon':
    case 'Minion':
      return 'evil';
    default:
      throw new Error(`未知角色: ${role}`);
  }
}

/**
 * 判断是否为好人角色
 */
function isGoodRole(role: AvalonRole): boolean {
  return getFaction(role) === 'good';
}

// ==================== 任务配置 ====================

/**
 * 获取当前轮次的队伍人数
 * @param playerCount 玩家数量
 * @param round 当前轮次 (1-5)
 * @returns 队伍人数
 */
export function getQuestTeamSize(playerCount: number, round: number): number {
  const configs = QUEST_CONFIGS[playerCount];
  if (!configs) {
    throw new Error(`不支持 ${playerCount} 人游戏`);
  }
  const config = configs[round - 1];
  if (!config) {
    throw new Error(`不支持第 ${round} 轮`);
  }
  return config.teamSize;
}

/**
 * 获取当前轮次需要的失败票数
 * @param playerCount 玩家数量
 * @param round 当前轮次
 * @param config 游戏配置
 * @returns 需要的失败票数
 */
export function getRequiredFailCount(
  playerCount: number,
  round: number,
  config: AvalonGameConfig,
): number {
  const configs = QUEST_CONFIGS[playerCount];
  if (!configs) {
    throw new Error(`不支持 ${playerCount} 人游戏`);
  }
  const questConfig = configs[round - 1];
  if (!questConfig) {
    throw new Error(`不支持第 ${round} 轮`);
  }

  // 7人及以上游戏，第4轮特殊规则
  // 如果配置禁用此规则，则返回默认的1
  if (playerCount >= 7 && round === 4) {
    return config.twoFailsRequiredOnFourthQuestForSevenPlus ? 2 : 1;
  }

  return questConfig.requiredFailCount;
}

/**
 * 获取当前轮次的任务配置
 */
export function getQuestConfig(
  playerCount: number,
  round: number,
  config: AvalonGameConfig,
): QuestConfig {
  return {
    round,
    teamSize: getQuestTeamSize(playerCount, round),
    requiredFailCount: getRequiredFailCount(playerCount, round, config),
  };
}

// ==================== 游戏状态操作 ====================

/**
 * 创建初始游戏状态
 */
export function createInitialState(
  roomId: string,
  players: AvalonPlayer[],
  config: AvalonGameConfig,
): AvalonGameState {
  return {
    roomId,
    phase: 'role_reveal',
    players,
    config,
    leaderIndex: randomInt(0, players.length),
    round: 1,
    rejectedTeamVoteCount: 0,
    proposedTeam: [],
    teamVotes: {},
    questActions: {},
    questHistory: [],
    goodScore: 0,
    evilScore: 0,
  };
}

/**
 * 提议任务队伍
 * @param state 当前游戏状态
 * @param leaderId 队长 ID
 * @param selectedPlayerIds 选中的玩家 ID 列表
 * @returns 更新后的游戏状态
 */
export function proposeTeam(
  state: AvalonGameState,
  leaderId: PlayerId,
  selectedPlayerIds: PlayerId[],
): AvalonGameState {
  // 验证游戏阶段
  if (state.phase !== 'team_building') {
    throw new Error('当前不是组队阶段');
  }

  // 验证是否是队长
  const leader = state.players[state.leaderIndex];
  if (!leader || leader.id !== leaderId) {
    throw new Error('你不是当前队长');
  }

  // 验证队伍人数
  const requiredSize = getQuestTeamSize(state.players.length, state.round);
  if (selectedPlayerIds.length !== requiredSize) {
    throw new Error(`队伍人数必须为 ${requiredSize} 人`);
  }

  // 验证所有选中的玩家都存在
  const playerIds = new Set(state.players.map(p => p.id));
  for (const id of selectedPlayerIds) {
    if (!playerIds.has(id)) {
      throw new Error(`玩家 ${id} 不存在`);
    }
  }

  // 验证没有重复
  if (new Set(selectedPlayerIds).size !== selectedPlayerIds.length) {
    throw new Error('不能重复选择同一玩家');
  }

  return {
    ...state,
    phase: 'team_voting',
    proposedTeam: selectedPlayerIds,
    teamVotes: {},
  };
}

/**
 * 提交组队投票
 * @param state 当前游戏状态
 * @param playerId 投票玩家 ID
 * @param vote 投票选择
 * @returns 更新后的游戏状态
 */
export function submitTeamVote(
  state: AvalonGameState,
  playerId: PlayerId,
  vote: TeamVote,
): AvalonGameState {
  // 验证游戏阶段
  if (state.phase !== 'team_voting') {
    throw new Error('当前不是投票阶段');
  }

  // 验证玩家是否存在
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }

  // 验证是否已经投票
  if (state.teamVotes[playerId]) {
    throw new Error('你已经投过票了');
  }

  return {
    ...state,
    teamVotes: {
      ...state.teamVotes,
      [playerId]: vote,
    },
  };
}

/**
 * 解析组队投票结果
 * @param state 当前游戏状态
 * @returns 投票结果和更新后的游戏状态
 */
export function resolveTeamVote(
  state: AvalonGameState,
): { result: TeamVoteResult; newState: AvalonGameState } {
  const votes = state.teamVotes;
  const totalVoters = state.players.length;
  const votedCount = Object.keys(votes).length;

  if (votedCount < totalVoters) {
    throw new Error('还有玩家未投票');
  }

  let approvals = 0;
  let rejections = 0;

  for (const vote of Object.values(votes)) {
    if (vote === 'approve') {
      approvals++;
    } else {
      rejections++;
    }
  }

  const approved = approvals > rejections;
  const newRejectedCount = approved ? 0 : state.rejectedTeamVoteCount + 1;

  const result: TeamVoteResult = {
    approved,
    approvals,
    rejections,
    votes,
    rejectedCount: newRejectedCount,
  };

  // 检查是否连续5次否决
  if (newRejectedCount >= 5) {
    return {
      result,
      newState: {
        ...state,
        phase: 'finished',
        rejectedTeamVoteCount: newRejectedCount,
        winner: 'evil',
        resultReason: 'five_rejected_teams',
      },
    };
  }

  // 投票通过，进入任务执行阶段
  if (approved) {
    return {
      result,
      newState: {
        ...state,
        phase: 'quest_action',
        rejectedTeamVoteCount: 0,
        questActions: {},
      },
    };
  }

  // 投票否决，换队长重新组队
  return {
    result,
    newState: {
      ...state,
      phase: 'team_building',
      rejectedTeamVoteCount: newRejectedCount,
      proposedTeam: [],
      teamVotes: {},
      leaderIndex: rotateLeaderIndex(state.leaderIndex, state.players.length),
    },
  };
}

/**
 * 提交任务行动
 * @param state 当前游戏状态
 * @param playerId 玩家 ID
 * @param action 行动选择
 * @returns 更新后的游戏状态
 */
export function submitQuestAction(
  state: AvalonGameState,
  playerId: PlayerId,
  action: QuestAction,
): AvalonGameState {
  // 验证游戏阶段
  if (state.phase !== 'quest_action') {
    throw new Error('当前不是任务执行阶段');
  }

  // 验证玩家是否在任务队伍中
  if (!state.proposedTeam.includes(playerId)) {
    throw new Error('你不在任务队伍中');
  }

  // 验证是否已经提交
  if (state.questActions[playerId]) {
    throw new Error('你已经提交过任务票了');
  }

  // 验证好人不能提交失败票
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }

  if (player.faction === 'good' && action === 'fail') {
    throw new Error('好人阵营不能提交失败票');
  }

  return {
    ...state,
    questActions: {
      ...state.questActions,
      [playerId]: action,
    },
  };
}

/**
 * 解析任务结果
 * @param state 当前游戏状态
 * @returns 任务结果和更新后的游戏状态
 */
export function resolveQuest(
  state: AvalonGameState,
): { result: QuestResult; newState: AvalonGameState } {
  const actions = state.questActions;
  const teamSize = state.proposedTeam.length;
  const actedCount = Object.keys(actions).length;

  if (actedCount < teamSize) {
    throw new Error('还有队员未提交任务票');
  }

  let successCount = 0;
  let failCount = 0;

  for (const action of Object.values(actions)) {
    if (action === 'success') {
      successCount++;
    } else {
      failCount++;
    }
  }

  const requiredFailCount = getRequiredFailCount(
    state.players.length,
    state.round,
    state.config,
  );

  const succeeded = failCount < requiredFailCount;

  const questResult: QuestResult = {
    round: state.round,
    team: state.proposedTeam,
    successCount,
    failCount,
    requiredFailCount,
    succeeded,
  };

  const newGoodScore = state.goodScore + (succeeded ? 1 : 0);
  const newEvilScore = state.evilScore + (succeeded ? 0 : 1);

  const newHistory: QuestHistoryItem[] = [
    ...state.questHistory,
    questResult,
  ];

  // 检查是否有人获胜
  if (newGoodScore >= 3) {
    // 好人完成3个任务，进入刺杀阶段
    return {
      result: questResult,
      newState: {
        ...state,
        phase: 'assassination',
        round: state.round + 1,
        goodScore: newGoodScore,
        evilScore: newEvilScore,
        questHistory: newHistory,
        proposedTeam: [],
        teamVotes: {},
        questActions: {},
        leaderIndex: rotateLeaderIndex(state.leaderIndex, state.players.length),
      },
    };
  }

  if (newEvilScore >= 3) {
    // 邪恶破坏3个任务，邪恶直接获胜
    return {
      result: questResult,
      newState: {
        ...state,
        phase: 'finished',
        round: state.round + 1,
        goodScore: newGoodScore,
        evilScore: newEvilScore,
        questHistory: newHistory,
        winner: 'evil',
        resultReason: 'three_failed_quests',
      },
    };
  }

  // 继续下一轮
  return {
    result: questResult,
    newState: {
      ...state,
      phase: 'team_building',
      round: state.round + 1,
      goodScore: newGoodScore,
      evilScore: newEvilScore,
      questHistory: newHistory,
      proposedTeam: [],
      teamVotes: {},
      questActions: {},
      leaderIndex: rotateLeaderIndex(state.leaderIndex, state.players.length),
    },
  };
}

/**
 * 刺杀梅林
 * @param state 当前游戏状态
 * @param assassinId 刺客 ID
 * @param targetPlayerId 目标玩家 ID
 * @returns 游戏结果和更新后的游戏状态
 */
export function assassinate(
  state: AvalonGameState,
  assassinId: PlayerId,
  targetPlayerId: PlayerId,
): { result: GameResult; newState: AvalonGameState } {
  // 验证游戏阶段
  if (state.phase !== 'assassination') {
    throw new Error('当前不是刺杀阶段');
  }

  // 验证是否是刺客
  const assassin = state.players.find(p => p.id === assassinId);
  if (!assassin) {
    throw new Error('玩家不存在');
  }
  if (assassin.role !== 'Assassin') {
    throw new Error('只有刺客可以执行刺杀');
  }

  // 验证目标存在
  const target = state.players.find(p => p.id === targetPlayerId);
  if (!target) {
    throw new Error('目标玩家不存在');
  }

  // 验证不能刺杀自己
  if (assassinId === targetPlayerId) {
    throw new Error('不能刺杀自己');
  }

  // 验证不能刺杀邪恶阵营
  if (target.faction === 'evil') {
    throw new Error('不能刺杀邪恶阵营玩家');
  }

  // 判断是否刺中梅林
  const isMerlin = target.role === 'Merlin';

  const result: GameResult = {
    winner: isMerlin ? 'evil' : 'good',
    reason: isMerlin ? 'merlin_assassinated' : 'assassination_failed',
    assassinatedPlayerId: targetPlayerId,
  };

  return {
    result,
    newState: {
      ...state,
      phase: 'finished',
      winner: result.winner,
      resultReason: result.reason,
      merlinId: isMerlin ? targetPlayerId : state.merlinId,
      assassinatedPlayerId: targetPlayerId,
    },
  };
}

/**
 * 检查胜利条件
 * @param state 当前游戏状态
 * @returns 胜利方（如果有的话）
 */
export function checkWinCondition(
  state: AvalonGameState,
): { winner: Winner; reason: ResultReason } | null {
  // 检查任务得分
  if (state.goodScore >= 3) {
    // 好人完成3个任务，需要进入刺杀阶段
    return null; // 不直接获胜，等待刺杀
  }
  if (state.evilScore >= 3) {
    return { winner: 'evil', reason: 'three_failed_quests' };
  }

  // 检查连续否决
  if (state.rejectedTeamVoteCount >= 5) {
    return { winner: 'evil', reason: 'five_rejected_teams' };
  }

  return null;
}

/**
 * 轮换队长索引
 */
function rotateLeaderIndex(currentIndex: number, playerCount: number): number {
  return (currentIndex + 1) % playerCount;
}

/**
 * 获取当前队长 ID
 */
export function getLeaderId(state: AvalonGameState): PlayerId {
  if (state.players.length === 0) {
    throw new Error('没有玩家');
  }
  const leader = state.players[state.leaderIndex];
  if (!leader) {
    throw new Error('队长索引越界');
  }
  return leader.id;
}

/**
 * 获取角色所属阵营
 */
export function getPlayerFaction(role: AvalonRole): Faction {
  return getFaction(role);
}

/**
 * 判断角色是否为邪恶阵营
 */
export function isEvilRole(role: AvalonRole): boolean {
  return getFaction(role) === 'evil';
}
