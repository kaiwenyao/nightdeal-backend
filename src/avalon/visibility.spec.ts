/**
 * 阿瓦隆游戏可见性逻辑单元测试
 */

import { getPlayerView, getTeamVoteView, getQuestActionView } from './visibility';
import {
  AvalonPlayer,
  AvalonGameState,
  AvalonGameConfig,
  DEFAULT_AVALON_CONFIG,
} from './types';

describe('Visibility', () => {
  // ==================== 辅助函数 ====================

  function createPlayers(): AvalonPlayer[] {
    return [
      { id: 'p1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
      { id: 'p2', name: 'Percival', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
      { id: 'p3', name: 'Loyal', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
      { id: 'p4', name: 'Morgana', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
      { id: 'p5', name: 'Assassin', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
    ];
  }

  function createState(players: AvalonPlayer[], config?: Partial<AvalonGameConfig>): AvalonGameState {
    return {
      roomId: 'test-room',
      phase: 'role_reveal',
      players,
      config: { ...DEFAULT_AVALON_CONFIG, ...config },
      leaderIndex: 0,
      round: 1,
      rejectedTeamVoteCount: 0,
      proposedTeam: [],
      teamVotes: {},
      questActions: {},
      questHistory: [],
      goodScore: 0,
      evilScore: 0,
      assassinId: 'p5',
      merlinId: 'p1',
    };
  }

  // ==================== 终局阶段视图测试 ====================

  describe('terminal phase view', () => {
    it('should build view without throwing in assassination phase at round 5', () => {
      // 回归：终局分支曾 round+1 到 6，getQuestConfig(5, 6) 抛异常导致游戏卡死
      const state = createState(createPlayers());
      state.phase = 'assassination';
      state.round = 5;
      state.goodScore = 3;

      const view = getPlayerView(state, 'p1');

      expect(view.phase).toBe('assassination');
      expect(view.currentQuestConfig.round).toBe(5);
    });

    it('should build view without throwing in finished phase at round 5', () => {
      const state = createState(createPlayers());
      state.phase = 'finished';
      state.round = 5;
      state.evilScore = 3;
      state.winner = 'evil';
      state.resultReason = 'three_failed_quests';

      const view = getPlayerView(state, 'p1');

      expect(view.phase).toBe('finished');
      expect(view.gameResult).toEqual({
        winner: 'evil',
        reason: 'three_failed_quests',
        assassinatedPlayerId: undefined,
      });
    });
  });

  // ==================== 梅林可见性测试 ====================

  describe('Merlin visibility', () => {
    it('should see all evil players except Mordred', () => {
      const players: AvalonPlayer[] = [
        { id: 'p1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Percival', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Loyal', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Morgana', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Assassin', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
        { id: 'p6', name: 'Mordred', seatNo: 6, isHost: false, isConnected: true, role: 'Mordred', faction: 'evil' },
      ];

      const state = createState(players);
      const view = getPlayerView(state, 'p1');

      expect(view.visibleInfo.merlinSees).toContain('p4'); // Morgana
      expect(view.visibleInfo.merlinSees).toContain('p5'); // Assassin
      expect(view.visibleInfo.merlinSees).not.toContain('p6'); // Mordred (hidden)
      expect(view.visibleInfo.merlinSees).not.toContain('p2'); // Percival (good)
      expect(view.visibleInfo.merlinSees).not.toContain('p3'); // Loyal (good)
    });

    it('should see Oberon by default', () => {
      const players: AvalonPlayer[] = [
        { id: 'p1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Percival', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Loyal', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Morgana', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Assassin', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
        { id: 'p6', name: 'Oberon', seatNo: 6, isHost: false, isConnected: true, role: 'Oberon', faction: 'evil' },
      ];

      const state = createState(players, { merlinCanSeeOberon: true });
      const view = getPlayerView(state, 'p1');

      expect(view.visibleInfo.merlinSees).toContain('p6'); // Oberon
    });

    it('should not see Oberon when configured', () => {
      const players: AvalonPlayer[] = [
        { id: 'p1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Percival', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Loyal', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Morgana', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Assassin', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
        { id: 'p6', name: 'Oberon', seatNo: 6, isHost: false, isConnected: true, role: 'Oberon', faction: 'evil' },
      ];

      const state = createState(players, { merlinCanSeeOberon: false });
      const view = getPlayerView(state, 'p1');

      expect(view.visibleInfo.merlinSees).not.toContain('p6'); // Oberon
    });
  });

  // ==================== 派西维尔可见性测试 ====================

  describe('Percival visibility', () => {
    it('should see Merlin and Morgana as candidates', () => {
      const players = createPlayers();
      const state = createState(players);
      const view = getPlayerView(state, 'p2');

      expect(view.visibleInfo.percivalSees).toContain('p1'); // Merlin
      expect(view.visibleInfo.percivalSees).toContain('p4'); // Morgana
      expect(view.visibleInfo.percivalSees).toHaveLength(2);
    });

    it('should only see Merlin if no Morgana', () => {
      const players: AvalonPlayer[] = [
        { id: 'p1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Percival', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Loyal', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Assassin', seatNo: 4, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
        { id: 'p5', name: 'Minion', seatNo: 5, isHost: false, isConnected: true, role: 'Minion', faction: 'evil' },
      ];

      const state = createState(players);
      const view = getPlayerView(state, 'p2');

      expect(view.visibleInfo.percivalSees).toContain('p1'); // Merlin
      expect(view.visibleInfo.percivalSees).toHaveLength(1);
    });
  });

  // ==================== 邪恶阵营可见性测试 ====================

  describe('Evil faction visibility', () => {
    it('should see other evil players except Oberon', () => {
      const players: AvalonPlayer[] = [
        { id: 'p1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Percival', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Loyal', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Morgana', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Assassin', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
        { id: 'p6', name: 'Oberon', seatNo: 6, isHost: false, isConnected: true, role: 'Oberon', faction: 'evil' },
      ];

      const state = createState(players);

      // Assassin should see Morgana but not Oberon
      const assassinView = getPlayerView(state, 'p5');
      expect(assassinView.visibleInfo.evilCompanions).toContain('p4'); // Morgana
      expect(assassinView.visibleInfo.evilCompanions).not.toContain('p6'); // Oberon

      // Morgana should see Assassin but not Oberon
      const morganaView = getPlayerView(state, 'p4');
      expect(morganaView.visibleInfo.evilCompanions).toContain('p5'); // Assassin
      expect(morganaView.visibleInfo.evilCompanions).not.toContain('p6'); // Oberon
    });

    it('should not see good players', () => {
      const players = createPlayers();
      const state = createState(players);

      const assassinView = getPlayerView(state, 'p5');
      expect(assassinView.visibleInfo.evilCompanions).not.toContain('p1'); // Merlin
      expect(assassinView.visibleInfo.evilCompanions).not.toContain('p2'); // Percival
      expect(assassinView.visibleInfo.evilCompanions).not.toContain('p3'); // Loyal
    });
  });

  // ==================== 奥伯伦可见性测试 ====================

  describe('Oberon visibility', () => {
    it('should not see any other evil players', () => {
      const players: AvalonPlayer[] = [
        { id: 'p1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'Percival', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'p3', name: 'Loyal', seatNo: 3, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p4', name: 'Morgana', seatNo: 4, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
        { id: 'p5', name: 'Assassin', seatNo: 5, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
        { id: 'p6', name: 'Oberon', seatNo: 6, isHost: false, isConnected: true, role: 'Oberon', faction: 'evil' },
      ];

      const state = createState(players);
      const view = getPlayerView(state, 'p6');

      expect(view.visibleInfo.evilCompanions).toBeUndefined();
      expect(view.visibleInfo.merlinSees).toBeUndefined();
      expect(view.visibleInfo.percivalSees).toBeUndefined();
    });
  });

  // ==================== 忠臣可见性测试 ====================

  describe('Loyal Servant visibility', () => {
    it('should not see any special information', () => {
      const players = createPlayers();
      const state = createState(players);
      const view = getPlayerView(state, 'p3');

      expect(view.visibleInfo.merlinSees).toBeUndefined();
      expect(view.visibleInfo.percivalSees).toBeUndefined();
      expect(view.visibleInfo.evilCompanions).toBeUndefined();
    });
  });

  // ==================== 投票视图测试 ====================

  describe('getTeamVoteView', () => {
    it('should show all votes when public', () => {
      const players = createPlayers();
      const state = createState(players, { publicTeamVote: true });
      state.teamVotes = {
        p1: 'approve',
        p2: 'reject',
        p3: 'approve',
      };

      const view = getTeamVoteView(state, 'p1');

      expect(view['p1']).toBe('approve');
      expect(view['p2']).toBe('reject');
      expect(view['p3']).toBe('approve');
    });

    it('should hide other votes when private', () => {
      const players = createPlayers();
      const state = createState(players, { publicTeamVote: false });
      state.teamVotes = {
        p1: 'approve',
        p2: 'reject',
        p3: 'approve',
      };

      const view = getTeamVoteView(state, 'p1');

      expect(view['p1']).toBe('approve');
      expect(view['p2']).toBe('unknown');
      expect(view['p3']).toBe('unknown');
    });
  });

  // ==================== 任务行动视图测试 ====================

  describe('getQuestActionView', () => {
    it('should return null if quest is not complete', () => {
      const players = createPlayers();
      const state = createState(players);
      state.proposedTeam = ['p1', 'p4'];
      state.questActions = { p1: 'success' };

      const view = getQuestActionView(state, 'p1');

      expect(view).toBeNull();
    });

    it('should return counts when quest is complete', () => {
      const players = createPlayers();
      const state = createState(players);
      state.proposedTeam = ['p1', 'p4'];
      state.questActions = { p1: 'success', p4: 'fail' };

      const view = getQuestActionView(state, 'p1');

      expect(view).toEqual({
        successCount: 1,
        failCount: 1,
        totalRequired: 2,
      });
    });
  });

  // ==================== 玩家视角测试 ====================

  describe('getPlayerView', () => {
    it('should return correct basic info', () => {
      const players = createPlayers();
      const state = createState(players);
      const view = getPlayerView(state, 'p1');

      expect(view.myId).toBe('p1');
      expect(view.myRole).toBe('Merlin');
      expect(view.myFaction).toBe('good');
      expect(view.phase).toBe('role_reveal');
      expect(view.round).toBe(1);
      expect(view.leaderId).toBe('p1');
      expect(view.goodScore).toBe(0);
      expect(view.evilScore).toBe(0);
    });

    it('should hide roles from other players', () => {
      const players = createPlayers();
      const state = createState(players);
      const view = getPlayerView(state, 'p1');

      for (const player of view.players) {
        expect(player).not.toHaveProperty('role');
        expect(player).not.toHaveProperty('faction');
      }
    });

    it('should indicate leader correctly', () => {
      const players = createPlayers();
      const state = createState(players);
      state.leaderIndex = 2; // Player 3 is leader

      const view = getPlayerView(state, 'p1');

      expect(view.players.find(p => p.id === 'p3')?.isLeader).toBe(true);
      expect(view.players.find(p => p.id === 'p1')?.isLeader).toBe(false);
    });

    it('should set canProposeTeam correctly', () => {
      const players = createPlayers();
      const state = createState(players);
      state.phase = 'team_building';

      const leaderView = getPlayerView(state, 'p1');
      expect(leaderView.canProposeTeam).toBe(true);

      const nonLeaderView = getPlayerView(state, 'p2');
      expect(nonLeaderView.canProposeTeam).toBe(false);
    });

    it('should set canVote correctly', () => {
      const players = createPlayers();
      const state = createState(players);
      state.phase = 'team_voting';

      const view = getPlayerView(state, 'p1');
      expect(view.canVote).toBe(true);

      state.teamVotes = { p1: 'approve' };
      const viewAfterVote = getPlayerView(state, 'p1');
      expect(viewAfterVote.canVote).toBe(false);
    });

    it('should set canPerformQuest correctly', () => {
      const players = createPlayers();
      const state = createState(players);
      state.phase = 'quest_action';
      state.proposedTeam = ['p1', 'p4'];

      const teamMemberView = getPlayerView(state, 'p1');
      expect(teamMemberView.canPerformQuest).toBe(true);

      const nonTeamMemberView = getPlayerView(state, 'p2');
      expect(nonTeamMemberView.canPerformQuest).toBe(false);
    });

    it('should set canAssassinate correctly', () => {
      const players = createPlayers();
      const state = createState(players);
      state.phase = 'assassination';

      const assassinView = getPlayerView(state, 'p5');
      expect(assassinView.canAssassinate).toBe(true);

      const nonAssassinView = getPlayerView(state, 'p4');
      expect(nonAssassinView.canAssassinate).toBe(false);
    });

    it('should include game result when finished', () => {
      const players = createPlayers();
      const state = createState(players);
      state.phase = 'finished';
      state.winner = 'good';
      state.resultReason = 'assassination_failed';

      const view = getPlayerView(state, 'p1');

      expect(view.gameResult).toBeDefined();
      expect(view.gameResult?.winner).toBe('good');
      expect(view.gameResult?.reason).toBe('assassination_failed');
    });
  });
});
