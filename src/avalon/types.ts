/**
 * 阿瓦隆游戏类型定义
 * 基于《抵抗组织：阿瓦隆》桌游规则
 */

// ==================== 基础类型 ====================

/** 玩家 ID 类型 */
export type PlayerId = string;

/** 阵营类型 */
export type Faction = 'good' | 'evil';

/** 阿瓦隆角色类型 */
export type AvalonRole =
  | 'Merlin'        // 梅林 - 好人，可以看到除莫德雷德外的邪恶阵营
  | 'Percival'      // 派西维尔 - 好人，可以看到梅林候选人
  | 'LoyalServant'  // 忠臣 - 好人，无特殊能力
  | 'Assassin'      // 刺客 - 邪恶，可以在游戏结束时刺杀梅林
  | 'Morgana'       // 莫甘娜 - 邪恶，伪装成梅林（派西维尔可见）
  | 'Mordred'       // 莫德雷德 - 邪恶，梅林看不到
  | 'Oberon'        // 奥伯伦 - 邪恶，不被其他邪恶阵营识别
  | 'Minion';       // 爪牙 - 邪恶，普通邪恶角色

/** 游戏阶段 */
export type GamePhase =
  | 'waiting'         // 等待玩家加入
  | 'role_reveal'     // 身份揭示阶段
  | 'team_building'   // 组队阶段（队长选人）
  | 'team_voting'     // 组队投票阶段
  | 'quest_action'    // 任务执行阶段
  | 'assassination'   // 刺杀阶段
  | 'finished';       // 游戏结束

/** 投票选项 */
export type TeamVote = 'approve' | 'reject';

/** 任务行动 */
export type QuestAction = 'success' | 'fail';

/** 胜利方 */
export type Winner = 'good' | 'evil';

/** 胜利原因 */
export type ResultReason =
  | 'three_success_quests'      // 好人完成三个任务
  | 'three_failed_quests'       // 邪恶破坏三个任务
  | 'merlin_assassinated'       // 梅林被刺杀
  | 'assassination_failed'      // 刺杀失败
  | 'five_rejected_teams';      // 连续五次组队被否决

// ==================== 配置类型 ====================

/** 阿瓦隆游戏配置 */
export interface AvalonGameConfig {
  /** 启用的角色列表 */
  roles: AvalonRole[];
  /** 梅林是否可以看到奥伯伦（默认 true） */
  merlinCanSeeOberon: boolean;
  /** 7人及以上游戏第4轮是否需要两张失败票（默认 true） */
  twoFailsRequiredOnFourthQuestForSevenPlus: boolean;
  /** 是否公开投票（默认 true） */
  publicTeamVote: boolean;
  /** 是否匿名任务票（默认 true） */
  anonymousQuestVote: boolean;
  /** 是否启用聊天（默认 true） */
  enableChat: boolean;
  /** 是否启用计时器（默认 false） */
  enableTimer: boolean;
  /** 每轮组队投票超时时间（秒） */
  teamVoteTimeoutSeconds: number;
  /** 每轮任务执行超时时间（秒） */
  questActionTimeoutSeconds: number;
}

/** 默认游戏配置 */
export const DEFAULT_AVALON_CONFIG: AvalonGameConfig = {
  roles: ['Merlin', 'Percival', 'Morgana', 'Assassin'],
  merlinCanSeeOberon: true,
  twoFailsRequiredOnFourthQuestForSevenPlus: true,
  publicTeamVote: true,
  anonymousQuestVote: true,
  enableChat: true,
  enableTimer: false,
  teamVoteTimeoutSeconds: 60,
  questActionTimeoutSeconds: 30,
};

// ==================== 游戏状态类型 ====================

/** 玩家信息 */
export interface AvalonPlayer {
  id: PlayerId;
  name: string;
  seatNo: number;
  isHost: boolean;
  isConnected: boolean;
  role?: AvalonRole;
  faction?: Faction;
}

/** 任务配置（每轮需要的人数和失败票数） */
export interface QuestConfig {
  round: number;
  teamSize: number;
  requiredFailCount: number;
}

/** 任务历史记录 */
export interface QuestHistoryItem {
  round: number;
  team: PlayerId[];
  successCount: number;
  failCount: number;
  requiredFailCount: number;
  succeeded: boolean;
}

/** 组队投票结果 */
export interface TeamVoteResult {
  approved: boolean;
  approvals: number;
  rejections: number;
  votes: Record<PlayerId, TeamVote>;
  rejectedCount: number;
}

/** 任务结果 */
export interface QuestResult {
  round: number;
  team: PlayerId[];
  successCount: number;
  failCount: number;
  requiredFailCount: number;
  succeeded: boolean;
}

/** 游戏结果 */
export interface GameResult {
  winner: Winner;
  reason: ResultReason;
  assassinatedPlayerId?: PlayerId;
}

/** 阿瓦隆游戏状态 */
export interface AvalonGameState {
  roomId: string;
  /** DB GameRecord id used to fence stale lifecycle owners. */
  generationId?: string;
  phase: GamePhase;
  players: AvalonPlayer[];
  config: AvalonGameConfig;

  // 游戏进度
  leaderIndex: number;
  round: number;
  rejectedTeamVoteCount: number;

  // 当前轮次状态
  proposedTeam: PlayerId[];
  teamVotes: Record<PlayerId, TeamVote>;
  questActions: Record<PlayerId, QuestAction>;

  // 历史记录
  questHistory: QuestHistoryItem[];

  // 得分
  goodScore: number;
  evilScore: number;

  // 关键角色 ID
  assassinId?: PlayerId;
  merlinId?: PlayerId;

  // 刺杀目标
  assassinatedPlayerId?: PlayerId;

  // 游戏结果
  winner?: Winner;
  resultReason?: ResultReason;
}

// ==================== 玩家视图类型 ====================

/** 玩家可见信息（用于前端展示） */
export interface PlayerView {
  // 自己的信息
  myId: PlayerId;
  myRole?: AvalonRole;
  myFaction?: Faction;

  // 游戏状态
  phase: GamePhase;
  round: number;
  leaderId: PlayerId;
  goodScore: number;
  evilScore: number;
  rejectedTeamVoteCount: number;

  // 玩家列表（隐藏其他玩家的角色）
  players: {
    id: PlayerId;
    name: string;
    seatNo: number;
    isHost: boolean;
    isConnected: boolean;
    isLeader: boolean;
  }[];

  // 当前组队
  proposedTeam: PlayerId[];

  // 任务配置
  currentQuestConfig: QuestConfig;

  // 可见信息（根据角色不同而不同）
  visibleInfo: VisibleInfo;

  // 游戏结果（仅在游戏结束时可见）
  gameResult?: GameResult;

  // 任务历史
  questHistory: QuestHistoryItem[];

  // 是否可以执行当前操作
  canProposeTeam: boolean;
  canVote: boolean;
  canPerformQuest: boolean;
  canAssassinate: boolean;
}

/** 可见信息类型 */
export interface VisibleInfo {
  /** 梅林看到的邪恶阵营（不含莫德雷德，奥伯伦可配置） */
  merlinSees?: PlayerId[];
  /** 派西维尔看到的梅林候选人 */
  percivalSees?: PlayerId[];
  /** 邪恶阵营看到的同伴（不含奥伯伦） */
  evilCompanions?: PlayerId[];
  /** 是否已投票 */
  hasVoted?: boolean;
  /** 是否已执行任务 */
  hasPerformedQuest?: boolean;
}

// ==================== 任务配置表 ====================

/** 任务人数配置表 */
export const QUEST_CONFIGS: Record<number, QuestConfig[]> = {
  5: [
    { round: 1, teamSize: 2, requiredFailCount: 1 },
    { round: 2, teamSize: 3, requiredFailCount: 1 },
    { round: 3, teamSize: 2, requiredFailCount: 1 },
    { round: 4, teamSize: 3, requiredFailCount: 1 },
    { round: 5, teamSize: 3, requiredFailCount: 1 },
  ],
  6: [
    { round: 1, teamSize: 2, requiredFailCount: 1 },
    { round: 2, teamSize: 3, requiredFailCount: 1 },
    { round: 3, teamSize: 4, requiredFailCount: 1 },
    { round: 4, teamSize: 3, requiredFailCount: 1 },
    { round: 5, teamSize: 4, requiredFailCount: 1 },
  ],
  7: [
    { round: 1, teamSize: 2, requiredFailCount: 1 },
    { round: 2, teamSize: 3, requiredFailCount: 1 },
    { round: 3, teamSize: 3, requiredFailCount: 1 },
    { round: 4, teamSize: 4, requiredFailCount: 2 },
    { round: 5, teamSize: 4, requiredFailCount: 1 },
  ],
  8: [
    { round: 1, teamSize: 3, requiredFailCount: 1 },
    { round: 2, teamSize: 4, requiredFailCount: 1 },
    { round: 3, teamSize: 4, requiredFailCount: 1 },
    { round: 4, teamSize: 5, requiredFailCount: 2 },
    { round: 5, teamSize: 5, requiredFailCount: 1 },
  ],
  9: [
    { round: 1, teamSize: 3, requiredFailCount: 1 },
    { round: 2, teamSize: 4, requiredFailCount: 1 },
    { round: 3, teamSize: 4, requiredFailCount: 1 },
    { round: 4, teamSize: 5, requiredFailCount: 2 },
    { round: 5, teamSize: 5, requiredFailCount: 1 },
  ],
  10: [
    { round: 1, teamSize: 3, requiredFailCount: 1 },
    { round: 2, teamSize: 4, requiredFailCount: 1 },
    { round: 3, teamSize: 4, requiredFailCount: 1 },
    { round: 4, teamSize: 5, requiredFailCount: 2 },
    { round: 5, teamSize: 5, requiredFailCount: 1 },
  ],
};

/** 阵营人数配置表 */
export const FACTION_COUNTS: Record<number, { good: number; evil: number }> = {
  5: { good: 3, evil: 2 },
  6: { good: 4, evil: 2 },
  7: { good: 4, evil: 3 },
  8: { good: 5, evil: 3 },
  9: { good: 6, evil: 3 },
  10: { good: 6, evil: 4 },
};
