/**
 * 阿瓦隆游戏可见性逻辑
 * 控制每个玩家能看到的信息
 */

import {
  PlayerId,
  AvalonRole,
  AvalonGameConfig,
  AvalonPlayer,
  AvalonGameState,
  PlayerView,
  VisibleInfo,
  QuestConfig,
  TeamVote,
} from './types';
import { getFaction, getQuestConfig, getLeaderId } from './game-engine';

/**
 * 获取玩家视角
 * 根据玩家的角色和游戏状态，返回该玩家可以看到的信息
 *
 * @param state 游戏状态
 * @param viewerId 观察者（当前玩家）ID
 * @returns 玩家视角
 */
export function getPlayerView(
  state: AvalonGameState,
  viewerId: PlayerId,
): PlayerView {
  const viewer = state.players.find(p => p.id === viewerId);
  if (!viewer) {
    throw new Error('玩家不存在');
  }

  const leaderId = getLeaderId(state);
  const questConfig = getQuestConfig(state.players.length, state.round, state.config);

  // 构建基础玩家列表（隐藏角色信息）
  const players = state.players.map(p => ({
    id: p.id,
    name: p.name,
    seatNo: p.seatNo,
    isHost: p.isHost,
    isConnected: p.isConnected,
    isLeader: p.id === leaderId,
  }));

  // 获取可见信息
  const visibleInfo = getVisibleInfo(state, viewerId);

  // 判断当前玩家可以执行的操作
  const canProposeTeam = state.phase === 'team_building' && viewer.id === leaderId;
  const canVote = state.phase === 'team_voting' && !state.teamVotes[viewerId];
  const canPerformQuest =
    state.phase === 'quest_action' &&
    state.proposedTeam.includes(viewerId) &&
    !state.questActions[viewerId];
  const canAssassinate =
    state.phase === 'assassination' &&
    viewer.role === 'Assassin';

  return {
    myId: viewerId,
    myRole: viewer.role,
    myFaction: viewer.faction,
    phase: state.phase,
    round: state.round,
    leaderId,
    goodScore: state.goodScore,
    evilScore: state.evilScore,
    rejectedTeamVoteCount: state.rejectedTeamVoteCount,
    players,
    proposedTeam: state.proposedTeam,
    currentQuestConfig: questConfig,
    visibleInfo,
    gameResult: state.winner && state.resultReason
      ? {
          winner: state.winner,
          reason: state.resultReason,
          assassinatedPlayerId: state.assassinatedPlayerId,
        }
      : undefined,
    questHistory: state.questHistory,
    canProposeTeam,
    canVote,
    canPerformQuest,
    canAssassinate,
  };
}

/**
 * 获取可见信息
 * 根据玩家角色返回不同的可见信息
 */
function getVisibleInfo(
  state: AvalonGameState,
  viewerId: PlayerId,
): VisibleInfo {
  const viewer = state.players.find(p => p.id === viewerId);
  if (!viewer || !viewer.role) {
    return {};
  }

  switch (viewer.role) {
    case 'Merlin':
      return getMerlinVisibility(state, viewerId);
    case 'Percival':
      return getPercivalVisibility(state, viewerId);
    case 'Assassin':
    case 'Morgana':
    case 'Mordred':
    case 'Minion':
      return getEvilVisibility(state, viewerId);
    case 'Oberon':
      return getOberonVisibility(state, viewerId);
    case 'LoyalServant':
      return getLoyalServantVisibility(state, viewerId);
    default:
      return {};
  }
}

/**
 * 梅林的可见信息
 * - 可以看到除莫德雷德外的邪恶阵营成员
 * - 奥伯伦的可见性可配置
 */
function getMerlinVisibility(
  state: AvalonGameState,
  viewerId: PlayerId,
): VisibleInfo {
  const evilPlayers: PlayerId[] = [];

  for (const player of state.players) {
    if (player.id === viewerId) continue; // 跳过自己

    if (!player.faction || player.faction !== 'evil') continue;

    // 莫德雷德对梅林不可见
    if (player.role === 'Mordred') continue;

    // 奥伯伦的可见性取决于配置
    if (player.role === 'Oberon' && !state.config.merlinCanSeeOberon) continue;

    evilPlayers.push(player.id);
  }

  return { merlinSees: evilPlayers };
}

/**
 * 派西维尔的可见信息
 * - 可以看到梅林候选人（梅林 + 莫甘娜）
 */
function getPercivalVisibility(
  state: AvalonGameState,
  viewerId: PlayerId,
): VisibleInfo {
  const merlinCandidates: PlayerId[] = [];

  for (const player of state.players) {
    if (player.id === viewerId) continue;

    // 梅林和莫甘娜都是派西维尔的"梅林候选人"
    if (player.role === 'Merlin' || player.role === 'Morgana') {
      merlinCandidates.push(player.id);
    }
  }

  return { percivalSees: merlinCandidates };
}

/**
 * 邪恶阵营的可见信息
 * - 可以看到其他邪恶阵营成员（不含奥伯伦）
 */
function getEvilVisibility(
  state: AvalonGameState,
  viewerId: PlayerId,
): VisibleInfo {
  const evilCompanions: PlayerId[] = [];

  for (const player of state.players) {
    if (player.id === viewerId) continue;

    // 跳过好人
    if (!player.faction || player.faction !== 'evil') continue;

    // 奥伯伦对其他邪恶阵营不可见
    if (player.role === 'Oberon') continue;

    evilCompanions.push(player.id);
  }

  return { evilCompanions };
}

/**
 * 奥伯伦的可见信息
 * - 奥伯伦不认识其他邪恶阵营成员
 * - 其他邪恶阵营成员也不认识奥伯伦
 */
function getOberonVisibility(
  _state: AvalonGameState,
  _viewerId: PlayerId,
): VisibleInfo {
  // 奥伯伦看不到任何人
  return {};
}

/**
 * 忠臣的可见信息
 * - 没有额外信息
 */
function getLoyalServantVisibility(
  _state: AvalonGameState,
  _viewerId: PlayerId,
): VisibleInfo {
  return {};
}

/**
 * 检查投票是否应该公开
 * @param config 游戏配置
 * @returns 是否公开投票
 */
export function shouldPublicTeamVote(config: AvalonGameConfig): boolean {
  return config.publicTeamVote;
}

/**
 * 检查任务票是否匿名
 * @param config 游戏配置
 * @returns 是否匿名
 */
export function isAnonymousQuestVote(config: AvalonGameConfig): boolean {
  return config.anonymousQuestVote;
}

/**
 * 获取投票视图
 * 根据配置决定是否显示其他玩家的投票
 */
export function getTeamVoteView(
  state: AvalonGameState,
  viewerId: PlayerId,
): Record<PlayerId, TeamVote | 'unknown'> {
  const isPublic = shouldPublicTeamVote(state.config);

  if (isPublic) {
    // 公开投票，所有人可见
    return { ...state.teamVotes };
  }

  // 匿名投票，只显示自己是否已投票
  const result: Record<PlayerId, TeamVote | 'unknown'> = {};
  for (const player of state.players) {
    if (player.id === viewerId && state.teamVotes[viewerId]) {
      result[player.id] = state.teamVotes[viewerId];
    } else if (state.teamVotes[player.id]) {
      result[player.id] = 'unknown'; // 已投票但不知道投了什么
    }
  }
  return result;
}

/**
 * 获取任务行动视图
 * 根据配置决定是否显示具体的任务票
 */
export function getQuestActionView(
  state: AvalonGameState,
  viewerId: PlayerId,
): { successCount: number; failCount: number; totalRequired: number } | null {
  // 只有在任务执行完成时才显示结果
  const actedCount = Object.keys(state.questActions).length;
  const teamSize = state.proposedTeam.length;

  if (actedCount < teamSize) {
    return null; // 还有人未提交
  }

  let successCount = 0;
  let failCount = 0;

  for (const action of Object.values(state.questActions)) {
    if (action === 'success') {
      successCount++;
    } else {
      failCount++;
    }
  }

  return {
    successCount,
    failCount,
    totalRequired: teamSize,
  };
}

