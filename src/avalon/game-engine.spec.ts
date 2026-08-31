/**
 * 阿瓦隆游戏引擎单元测试
 */

import {
  generateRoles,
  assignRoles,
  getFaction,
  getQuestTeamSize,
  getRequiredFailCount,
  getQuestConfig,
  createInitialState,
  beginGame,
  proposeTeam,
  submitTeamVote,
  resolveTeamVote,
  submitQuestAction,
  resolveQuest,
  assassinate,
  checkWinCondition,
  getLeaderId,
} from './game-engine';
import {
  AvalonRole,
  AvalonGameConfig,
  AvalonPlayer,
  AvalonGameState,
  DEFAULT_AVALON_CONFIG,
} from './types';

describe('Game Engine', () => {
  // ==================== 角色分配测试 ====================

  describe('generateRoles', () => {
    it('should generate correct roles for 5 players', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Merlin', 'Percival', 'Morgana', 'Assassin'],
      };

      const roles = generateRoles(5, config);

      expect(roles).toHaveLength(5);
      expect(roles.filter(r => r === 'Merlin')).toHaveLength(1);
      expect(roles.filter(r => r === 'Percival')).toHaveLength(1);
      expect(roles.filter(r => r === 'Morgana')).toHaveLength(1);
      expect(roles.filter(r => r === 'Assassin')).toHaveLength(1);
      expect(roles.filter(r => r === 'LoyalServant')).toHaveLength(1);
    });

    it('should generate correct roles for 6 players', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Merlin', 'Percival', 'Morgana', 'Assassin'],
      };

      const roles = generateRoles(6, config);

      expect(roles).toHaveLength(6);
      expect(roles.filter(r => r === 'LoyalServant')).toHaveLength(2);
    });

    it('should reject config without Merlin', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Percival', 'Morgana', 'Assassin'],
      };

      expect(() => generateRoles(5, config)).toThrow('角色配置必须包含梅林(Merlin)');
    });

    it('should reject config without Assassin', () => {
      // 缺刺客时好人 3 胜进入刺杀阶段后无人能操作，游戏永久死局，必须拒绝开局
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Merlin', 'Percival', 'Morgana'],
      };

      expect(() => generateRoles(5, config)).toThrow('角色配置必须包含刺客(Assassin)');
    });

    it('should generate correct roles for 7 players', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Merlin', 'Percival', 'Morgana', 'Assassin'],
      };

      const roles = generateRoles(7, config);

      expect(roles).toHaveLength(7);
      expect(roles.filter(r => r === 'LoyalServant')).toHaveLength(2);
      expect(roles.filter(r => r === 'Minion')).toHaveLength(1);
    });

    it('should generate correct roles for 10 players', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Merlin', 'Percival', 'Morgana', 'Assassin'],
      };

      const roles = generateRoles(10, config);

      expect(roles).toHaveLength(10);
      expect(roles.filter(r => r === 'LoyalServant')).toHaveLength(4);
      expect(roles.filter(r => r === 'Minion')).toHaveLength(2);
    });

    it('should throw error for invalid player count', () => {
      const config = DEFAULT_AVALON_CONFIG;
      expect(() => generateRoles(4, config)).toThrow('玩家人数必须在 5-10 人之间');
      expect(() => generateRoles(11, config)).toThrow('玩家人数必须在 5-10 人之间');
    });

    it('should handle optional roles', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Merlin', 'Percival', 'Mordred', 'Morgana', 'Assassin'],
      };

      const roles = generateRoles(7, config);

      expect(roles).toHaveLength(7);
      expect(roles.filter(r => r === 'Mordred')).toHaveLength(1);
      expect(roles.filter(r => r === 'LoyalServant')).toHaveLength(2);
      expect(roles.filter(r => r === 'Minion')).toHaveLength(0);
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to players', () => {
      const players = [
        { seatNo: 1, userId: 'p1' },
        { seatNo: 2, userId: 'p2' },
        { seatNo: 3, userId: 'p3' },
        { seatNo: 4, userId: 'p4' },
        { seatNo: 5, userId: 'p5' },
      ];
      const roles: AvalonRole[] = ['Merlin', 'Percival', 'LoyalServant', 'Morgana', 'Assassin'];

      const assignments = assignRoles(players, roles);

      expect(assignments).toHaveLength(5);
      expect(assignments.map(a => a.role).sort()).toEqual(roles.sort());
    });

    it('should throw error if player count does not match role count', () => {
      const players = [{ seatNo: 1, userId: 'p1' }];
      const roles: AvalonRole[] = ['Merlin', 'Percival'];

      expect(() => assignRoles(players, roles)).toThrow('玩家数量与角色数量不匹配');
    });
  });

  describe('getFaction', () => {
    it('should return correct faction for each role', () => {
      expect(getFaction('Merlin')).toBe('good');
      expect(getFaction('Percival')).toBe('good');
      expect(getFaction('LoyalServant')).toBe('good');
      expect(getFaction('Assassin')).toBe('evil');
      expect(getFaction('Morgana')).toBe('evil');
      expect(getFaction('Mordred')).toBe('evil');
      expect(getFaction('Oberon')).toBe('evil');
      expect(getFaction('Minion')).toBe('evil');
    });
  });

  // ==================== 任务配置测试 ====================

  describe('getQuestTeamSize', () => {
    it('should return correct team sizes for 5 players', () => {
      expect(getQuestTeamSize(5, 1)).toBe(2);
      expect(getQuestTeamSize(5, 2)).toBe(3);
      expect(getQuestTeamSize(5, 3)).toBe(2);
      expect(getQuestTeamSize(5, 4)).toBe(3);
      expect(getQuestTeamSize(5, 5)).toBe(3);
    });

    it('should return correct team sizes for 7 players', () => {
      expect(getQuestTeamSize(7, 1)).toBe(2);
      expect(getQuestTeamSize(7, 2)).toBe(3);
      expect(getQuestTeamSize(7, 3)).toBe(3);
      expect(getQuestTeamSize(7, 4)).toBe(4);
      expect(getQuestTeamSize(7, 5)).toBe(4);
    });

    it('should throw error for invalid player count', () => {
      expect(() => getQuestTeamSize(4, 1)).toThrow('不支持 4 人游戏');
    });

    it('should throw error for invalid round', () => {
      expect(() => getQuestTeamSize(5, 6)).toThrow('不支持第 6 轮');
    });
  });

  describe('getRequiredFailCount', () => {
    it('should return 1 for most quests', () => {
      const config = DEFAULT_AVALON_CONFIG;
      expect(getRequiredFailCount(5, 1, config)).toBe(1);
      expect(getRequiredFailCount(5, 2, config)).toBe(1);
      expect(getRequiredFailCount(5, 3, config)).toBe(1);
      expect(getRequiredFailCount(5, 4, config)).toBe(1);
      expect(getRequiredFailCount(5, 5, config)).toBe(1);
    });

    it('should return 2 for 4th quest with 7+ players when enabled', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        twoFailsRequiredOnFourthQuestForSevenPlus: true,
      };
      expect(getRequiredFailCount(7, 4, config)).toBe(2);
      expect(getRequiredFailCount(8, 4, config)).toBe(2);
      expect(getRequiredFailCount(9, 4, config)).toBe(2);
      expect(getRequiredFailCount(10, 4, config)).toBe(2);
    });

    it('should return 1 for 4th quest with 7+ players when disabled', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        twoFailsRequiredOnFourthQuestForSevenPlus: false,
      };
      expect(getRequiredFailCount(7, 4, config)).toBe(1);
    });
  });

  // ==================== 游戏状态操作测试 ====================

  describe('beginGame', () => {
    const players: AvalonPlayer[] = [
      { id: 'p1', name: 'Player 1', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
      { id: 'p2', name: 'Player 2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
    ];
    const baseState: AvalonGameState = {
      roomId: 'test-room',
      phase: 'role_reveal',
      players,
      config: DEFAULT_AVALON_CONFIG,
      leaderIndex: 0,
      round: 1,
      rejectedTeamVoteCount: 0,
      proposedTeam: [],
      teamVotes: {},
      questActions: {},
      questHistory: [],
      goodScore: 0,
      evilScore: 0,
    };

    it('advances host from role_reveal to team_building', () => {
      expect(beginGame(baseState, 'p1').phase).toBe('team_building');
    });

    it('rejects a non-host', () => {
      expect(() => beginGame(baseState, 'p2')).toThrow('仅房主可以开始任务阶段');
    });

    it('rejects when not in role_reveal', () => {
      expect(() => beginGame({ ...baseState, phase: 'team_building' }, 'p1')).toThrow('当前不是身份揭示阶段');
    });
  });

  describe('proposeTeam', () => {
    let state: AvalonGameState;
    let players: AvalonPlayer[];

    beforeEach(() => {
      players = [
        { id: 'p1', name: 'Player 1', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Player 2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Player 3', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Player 4', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Player 5', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
      ];

      state = {
        roomId: 'test-room',
        phase: 'team_building',
        players,
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 1,
        rejectedTeamVoteCount: 0,
        proposedTeam: [],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 0,
        evilScore: 0,
      };
    });

    it('should propose team successfully', () => {
      const newState = proposeTeam(state, 'p1', ['p1', 'p2']);

      expect(newState.phase).toBe('team_voting');
      expect(newState.proposedTeam).toEqual(['p1', 'p2']);
      expect(newState.teamVotes).toEqual({});
    });

    it('should throw error if not in team_building phase', () => {
      state.phase = 'team_voting';
      expect(() => proposeTeam(state, 'p1', ['p1', 'p2'])).toThrow('当前不是组队阶段');
    });

    it('should throw error if not the leader', () => {
      expect(() => proposeTeam(state, 'p2', ['p1', 'p2'])).toThrow('你不是当前队长');
    });

    it('should throw error if team size is wrong', () => {
      expect(() => proposeTeam(state, 'p1', ['p1'])).toThrow('队伍人数必须为 2 人');
      expect(() => proposeTeam(state, 'p1', ['p1', 'p2', 'p3'])).toThrow('队伍人数必须为 2 人');
    });

    it('should throw error if player does not exist', () => {
      expect(() => proposeTeam(state, 'p1', ['p1', 'p99'])).toThrow('玩家 p99 不存在');
    });

    it('should throw error if duplicate players', () => {
      expect(() => proposeTeam(state, 'p1', ['p1', 'p1'])).toThrow('不能重复选择同一玩家');
    });
  });

  describe('submitTeamVote', () => {
    let state: AvalonGameState;
    let players: AvalonPlayer[];

    beforeEach(() => {
      players = [
        { id: 'p1', name: 'Player 1', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Player 2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Player 3', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Player 4', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Player 5', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
      ];

      state = {
        roomId: 'test-room',
        phase: 'team_voting',
        players,
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 1,
        rejectedTeamVoteCount: 0,
        proposedTeam: ['p1', 'p2'],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 0,
        evilScore: 0,
      };
    });

    it('should submit vote successfully', () => {
      const newState = submitTeamVote(state, 'p1', 'approve');

      expect(newState.teamVotes['p1']).toBe('approve');
    });

    it('should throw error if not in team_voting phase', () => {
      state.phase = 'team_building';
      expect(() => submitTeamVote(state, 'p1', 'approve')).toThrow('当前不是投票阶段');
    });

    it('should throw error if player does not exist', () => {
      expect(() => submitTeamVote(state, 'p99', 'approve')).toThrow('玩家不存在');
    });

    it('should throw error if already voted', () => {
      state.teamVotes = { p1: 'approve' };
      expect(() => submitTeamVote(state, 'p1', 'reject')).toThrow('你已经投过票了');
    });
  });

  describe('resolveTeamVote', () => {
    let state: AvalonGameState;
    let players: AvalonPlayer[];

    beforeEach(() => {
      players = [
        { id: 'p1', name: 'Player 1', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Player 2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Player 3', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Player 4', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Player 5', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
      ];

      state = {
        roomId: 'test-room',
        phase: 'team_voting',
        players,
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 1,
        rejectedTeamVoteCount: 0,
        proposedTeam: ['p1', 'p2'],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 0,
        evilScore: 0,
      };
    });

    it('should approve team when majority approves', () => {
      state.teamVotes = {
        p1: 'approve',
        p2: 'approve',
        p3: 'approve',
        p4: 'reject',
        p5: 'reject',
      };

      const { result, newState } = resolveTeamVote(state);

      expect(result.approved).toBe(true);
      expect(result.approvals).toBe(3);
      expect(result.rejections).toBe(2);
      expect(newState.phase).toBe('quest_action');
    });

    it('should reject team when majority rejects', () => {
      state.teamVotes = {
        p1: 'approve',
        p2: 'reject',
        p3: 'reject',
        p4: 'reject',
        p5: 'reject',
      };

      const { result, newState } = resolveTeamVote(state);

      expect(result.approved).toBe(false);
      expect(result.approvals).toBe(1);
      expect(result.rejections).toBe(4);
      expect(newState.phase).toBe('team_building');
      expect(newState.rejectedTeamVoteCount).toBe(1);
    });

    it('should throw error if not all players have voted', () => {
      state.teamVotes = {
        p1: 'approve',
        p2: 'approve',
      };

      expect(() => resolveTeamVote(state)).toThrow('还有玩家未投票');
    });

    it('should throw error if not in team_voting phase (double-resolve guard)', () => {
      // 弱网下两名玩家同时触发解析：后到的调用阶段已变化，必须抛错而不是重复计分
      state.phase = 'quest_action';
      state.teamVotes = {
        p1: 'approve',
        p2: 'approve',
        p3: 'approve',
        p4: 'reject',
        p5: 'reject',
      };

      expect(() => resolveTeamVote(state)).toThrow('当前不是投票阶段');
    });

    it('should end game after 5 consecutive rejections', () => {
      state.rejectedTeamVoteCount = 4;
      state.teamVotes = {
        p1: 'reject',
        p2: 'reject',
        p3: 'reject',
        p4: 'reject',
        p5: 'reject',
      };

      const { result, newState } = resolveTeamVote(state);

      expect(result.approved).toBe(false);
      expect(newState.phase).toBe('finished');
      expect(newState.winner).toBe('evil');
      expect(newState.resultReason).toBe('five_rejected_teams');
    });
  });

  describe('submitQuestAction', () => {
    let state: AvalonGameState;
    let players: AvalonPlayer[];

    beforeEach(() => {
      players = [
        { id: 'p1', name: 'Player 1', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Player 2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Player 3', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Player 4', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Player 5', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
      ];

      state = {
        roomId: 'test-room',
        phase: 'quest_action',
        players,
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 1,
        rejectedTeamVoteCount: 0,
        proposedTeam: ['p1', 'p4'],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 0,
        evilScore: 0,
      };
    });

    it('should submit quest action successfully', () => {
      const newState = submitQuestAction(state, 'p1', 'success');

      expect(newState.questActions['p1']).toBe('success');
    });

    it('should throw error if not in quest_action phase', () => {
      state.phase = 'team_building';
      expect(() => submitQuestAction(state, 'p1', 'success')).toThrow('当前不是任务执行阶段');
    });

    it('should throw error if not in team', () => {
      expect(() => submitQuestAction(state, 'p3', 'success')).toThrow('你不在任务队伍中');
    });

    it('should throw error if good player tries to fail', () => {
      expect(() => submitQuestAction(state, 'p1', 'fail')).toThrow('好人阵营不能提交失败票');
    });

    it('should allow evil player to fail', () => {
      const newState = submitQuestAction(state, 'p4', 'fail');

      expect(newState.questActions['p4']).toBe('fail');
    });

    it('should throw error if already submitted', () => {
      state.questActions = { p1: 'success' };
      expect(() => submitQuestAction(state, 'p1', 'success')).toThrow('你已经提交过任务票了');
    });
  });

  describe('resolveQuest', () => {
    let state: AvalonGameState;
    let players: AvalonPlayer[];

    beforeEach(() => {
      players = [
        { id: 'p1', name: 'Player 1', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Player 2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Player 3', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Player 4', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Player 5', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
      ];

      state = {
        roomId: 'test-room',
        phase: 'quest_action',
        players,
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 1,
        rejectedTeamVoteCount: 0,
        proposedTeam: ['p1', 'p4'],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 0,
        evilScore: 0,
      };
    });

    it('should succeed quest with no fails', () => {
      state.questActions = {
        p1: 'success',
        p4: 'success',
      };

      const { result, newState } = resolveQuest(state);

      expect(result.succeeded).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failCount).toBe(0);
      expect(newState.goodScore).toBe(1);
      expect(newState.evilScore).toBe(0);
    });

    it('should fail quest with enough fails', () => {
      state.questActions = {
        p1: 'success',
        p4: 'fail',
      };

      const { result, newState } = resolveQuest(state);

      expect(result.succeeded).toBe(false);
      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(1);
      expect(newState.goodScore).toBe(0);
      expect(newState.evilScore).toBe(1);
    });

    it('should throw error if not all players have acted', () => {
      state.questActions = {
        p1: 'success',
      };

      expect(() => resolveQuest(state)).toThrow('还有队员未提交任务票');
    });

    it('should enter assassination phase after 3 good wins', () => {
      state.goodScore = 2;
      state.questActions = {
        p1: 'success',
        p4: 'success',
      };

      const { result, newState } = resolveQuest(state);

      expect(result.succeeded).toBe(true);
      expect(newState.goodScore).toBe(3);
      expect(newState.phase).toBe('assassination');
    });

    it('should end immediately with good winning when no assassin exists', () => {
      // 无刺客配置（assassin:false）下好人达成 3 任务：无人可刺杀，
      // 若照常进入 assassination 阶段会永久卡死，必须直接判好人获胜。
      state.players = state.players.map((p) =>
        p.role === 'Assassin' ? { ...p, role: 'Minion' } : p,
      );
      state.goodScore = 2;
      state.questActions = {
        p1: 'success',
        p4: 'success',
      };

      const { newState } = resolveQuest(state);

      expect(newState.goodScore).toBe(3);
      expect(newState.phase).toBe('finished');
      expect(newState.winner).toBe('good');
      expect(newState.resultReason).toBe('three_success_quests');
    });

    it('should throw error if not in quest_action phase (double-resolve guard)', () => {
      state.phase = 'team_building';
      state.questActions = {
        p1: 'success',
        p4: 'success',
      };

      expect(() => resolveQuest(state)).toThrow('当前不是任务执行阶段');
    });

    it('should not advance round past 5 when entering assassination on the final round', () => {
      // 第 5 轮好人 3 胜：终局分支不能 round+1，否则 getPlayerView 构建
      // currentQuestConfig 时 getQuestTeamSize(n, 6) 抛异常，游戏永久卡死
      state.round = 5;
      state.goodScore = 2;
      state.proposedTeam = ['p1', 'p4', 'p2'];
      state.questActions = {
        p1: 'success',
        p4: 'success',
        p2: 'success',
      };

      const { newState } = resolveQuest(state);

      expect(newState.phase).toBe('assassination');
      expect(newState.round).toBe(5);
    });

    it('should not advance round past 5 when evil wins on the final round', () => {
      state.round = 5;
      state.evilScore = 2;
      state.proposedTeam = ['p1', 'p4', 'p2'];
      state.questActions = {
        p1: 'success',
        p4: 'fail',
        p2: 'success',
      };

      const { newState } = resolveQuest(state);

      expect(newState.phase).toBe('finished');
      expect(newState.winner).toBe('evil');
      expect(newState.round).toBe(5);
    });

    it('should end game after 3 evil wins', () => {
      state.evilScore = 2;
      state.questActions = {
        p1: 'success',
        p4: 'fail',
      };

      const { result, newState } = resolveQuest(state);

      expect(result.succeeded).toBe(false);
      expect(newState.evilScore).toBe(3);
      expect(newState.phase).toBe('finished');
      expect(newState.winner).toBe('evil');
      expect(newState.resultReason).toBe('three_failed_quests');
    });
  });

  describe('assassinate', () => {
    let state: AvalonGameState;
    let players: AvalonPlayer[];

    beforeEach(() => {
      players = [
        { id: 'p1', name: 'Player 1', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Player 2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Player 3', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Player 4', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Player 5', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
      ];

      state = {
        roomId: 'test-room',
        phase: 'assassination',
        players,
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 4,
        rejectedTeamVoteCount: 0,
        proposedTeam: [],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 3,
        evilScore: 0,
        assassinId: 'p5',
      };
    });

    it('should assassinate merlin successfully', () => {
      const { result, newState } = assassinate(state, 'p5', 'p1');

      expect(result.winner).toBe('evil');
      expect(result.reason).toBe('merlin_assassinated');
      expect(result.assassinatedPlayerId).toBe('p1');
      expect(newState.phase).toBe('finished');
      expect(newState.winner).toBe('evil');
    });

    it('should fail assassination if target is not merlin', () => {
      const { result, newState } = assassinate(state, 'p5', 'p2');

      expect(result.winner).toBe('good');
      expect(result.reason).toBe('assassination_failed');
      expect(result.assassinatedPlayerId).toBe('p2');
      expect(newState.phase).toBe('finished');
      expect(newState.winner).toBe('good');
    });

    it('should throw error if not in assassination phase', () => {
      state.phase = 'team_building';
      expect(() => assassinate(state, 'p5', 'p1')).toThrow('当前不是刺杀阶段');
    });

    it('should throw error if not the assassin', () => {
      expect(() => assassinate(state, 'p4', 'p1')).toThrow('只有刺客可以执行刺杀');
    });

    it('should throw error if target does not exist', () => {
      expect(() => assassinate(state, 'p5', 'p99')).toThrow('目标玩家不存在');
    });
  });

  describe('checkWinCondition', () => {
    it('should return null when game is ongoing', () => {
      const state: AvalonGameState = {
        roomId: 'test',
        phase: 'team_building',
        players: [],
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 1,
        rejectedTeamVoteCount: 0,
        proposedTeam: [],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 1,
        evilScore: 1,
      };

      expect(checkWinCondition(state)).toBeNull();
    });

    it('should return evil win after 3 failed quests', () => {
      const state: AvalonGameState = {
        roomId: 'test',
        phase: 'quest_action',
        players: [],
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 4,
        rejectedTeamVoteCount: 0,
        proposedTeam: [],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 0,
        evilScore: 3,
      };

      const result = checkWinCondition(state);
      expect(result).toEqual({ winner: 'evil', reason: 'three_failed_quests' });
    });

    it('should return evil win after 5 rejected teams', () => {
      const state: AvalonGameState = {
        roomId: 'test',
        phase: 'team_voting',
        players: [],
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 3,
        rejectedTeamVoteCount: 5,
        proposedTeam: [],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 1,
        evilScore: 1,
      };

      const result = checkWinCondition(state);
      expect(result).toEqual({ winner: 'evil', reason: 'five_rejected_teams' });
    });

    it('should return null when good has 3 wins (needs assassination)', () => {
      const state: AvalonGameState = {
        roomId: 'test',
        phase: 'assassination',
        players: [],
        config: DEFAULT_AVALON_CONFIG,
        leaderIndex: 0,
        round: 4,
        rejectedTeamVoteCount: 0,
        proposedTeam: [],
        teamVotes: {},
        questActions: {},
        questHistory: [],
        goodScore: 3,
        evilScore: 0,
      };

      expect(checkWinCondition(state)).toBeNull();
    });
  });
});

// ==================== 以下为追加的覆盖率测试（不影响以上原有用例） ====================

import {
  getPlayerFaction,
  isEvilRole,
} from './game-engine';

describe('Game Engine validation edge cases', () => {
  function buildAssassinationState(): AvalonGameState {
    return {
      roomId: 'test-room',
      phase: 'assassination',
      players: [
        { id: 'p1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'P2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Loyal', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Morgana', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Assassin', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
      ],
      config: DEFAULT_AVALON_CONFIG,
      leaderIndex: 0,
      round: 5,
      rejectedTeamVoteCount: 0,
      proposedTeam: [],
      teamVotes: {},
      questActions: {},
      questHistory: [],
      goodScore: 3,
      evilScore: 1,
      assassinId: 'p5',
      merlinId: 'p1',
    };
  }

  describe('generateRoles count validation', () => {
    it('rejects when good roles exceed the faction count (duplicated entries)', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Merlin', 'Percival', 'LoyalServant', 'Merlin', 'Assassin'],
      };

      expect(() => generateRoles(5, config)).toThrow('好人角色数量(4)超过好人数量(3)');
    });

    it('rejects when evil roles exceed the faction count (duplicated entries)', () => {
      const config: AvalonGameConfig = {
        ...DEFAULT_AVALON_CONFIG,
        roles: ['Merlin', 'Assassin', 'Assassin', 'Assassin'],
      };

      expect(() => generateRoles(5, config)).toThrow('邪恶角色数量(3)超过邪恶数量(2)');
    });
  });

  describe('getFaction unknown role', () => {
    it('throws for an unknown role', () => {
      expect(() => getFaction('Sorcerer' as AvalonRole)).toThrow('未知角色: Sorcerer');
    });
  });

  describe('getRequiredFailCount validation', () => {
    it('throws for an unsupported player count', () => {
      expect(() => getRequiredFailCount(4, 1, DEFAULT_AVALON_CONFIG)).toThrow('不支持 4 人游戏');
    });

    it('throws for an unsupported round', () => {
      expect(() => getRequiredFailCount(5, 6, DEFAULT_AVALON_CONFIG)).toThrow('不支持第 6 轮');
    });
  });

  describe('submitQuestAction validation', () => {
    it('throws when the actor is not a registered player', () => {
      // 未知玩家先通过队伍校验（proposedTeam 直接包含它），随后在玩家查找处失败
      const state: AvalonGameState = {
        ...buildAssassinationState(),
        phase: 'quest_action',
        proposedTeam: ['p99'],
      };

      expect(() => submitQuestAction(state, 'p99', 'success')).toThrow('玩家不存在');
    });
  });

  describe('assassinate validation', () => {
    it('throws when the assassin is not a registered player', () => {
      expect(() => assassinate(buildAssassinationState(), 'p99', 'p1')).toThrow('玩家不存在');
    });

    it('throws when the assassin targets himself', () => {
      expect(() => assassinate(buildAssassinationState(), 'p5', 'p5')).toThrow('不能刺杀自己');
    });

    it('throws when the target is evil', () => {
      expect(() => assassinate(buildAssassinationState(), 'p5', 'p4')).toThrow('不能刺杀邪恶阵营玩家');
    });
  });

  describe('getLeaderId validation', () => {
    it('throws when there are no players', () => {
      const state: AvalonGameState = { ...buildAssassinationState(), players: [] };

      expect(() => getLeaderId(state)).toThrow('没有玩家');
    });

    it('throws when the leader index is out of bounds', () => {
      const state: AvalonGameState = { ...buildAssassinationState(), leaderIndex: 99 };

      expect(() => getLeaderId(state)).toThrow('队长索引越界');
    });
  });

  describe('getQuestConfig', () => {
    it('combines team size and required fail count for the round', () => {
      expect(getQuestConfig(5, 1, DEFAULT_AVALON_CONFIG)).toEqual({
        round: 1,
        teamSize: 2,
        requiredFailCount: 1,
      });
      expect(getQuestConfig(7, 4, DEFAULT_AVALON_CONFIG)).toEqual({
        round: 4,
        teamSize: 4,
        requiredFailCount: 2,
      });
    });
  });

  describe('faction helpers', () => {
    it('getPlayerFaction mirrors getFaction', () => {
      expect(getPlayerFaction('Merlin')).toBe('good');
      expect(getPlayerFaction('Morgana')).toBe('evil');
    });

    it('isEvilRole identifies evil roles', () => {
      expect(isEvilRole('Assassin')).toBe(true);
      expect(isEvilRole('Percival')).toBe(false);
    });
  });
});
