/**
 * 阿瓦隆游戏服务单元测试
 * 使用内存 Map 模拟 RedisService
 */

import { AvalonService } from './avalon.service';
import { RedisService } from '../redis/redis.service';
import {
  AvalonGameConfig,
  AvalonGameState,
  DEFAULT_AVALON_CONFIG,
} from './types';

describe('AvalonService', () => {
  let service: AvalonService;
  let store: Map<string, string>;

  const mockRedis = {
    get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    setWithLock: jest.fn((_lease: unknown, key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    delWithLock: jest.fn((_lease: unknown, key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    expire: jest.fn().mockResolvedValue(undefined),
    incr: jest.fn().mockResolvedValue(1),
    hset: jest.fn().mockResolvedValue(undefined),
    hsetWithExpire: jest.fn().mockResolvedValue(undefined),
    hget: jest.fn().mockResolvedValue(null),
    withLock: jest.fn().mockImplementation(async (key: string, _ttl: number, fn: (lease: unknown) => Promise<unknown>) => fn({ key, token: 'test-token' })),
  };

  const basePlayers = [
    { seatNo: 1, userId: 'u1', name: 'Host', isHost: true },
    { seatNo: 2, userId: 'u2', name: 'P2', isHost: false },
    { seatNo: 3, userId: 'u3', name: 'P3', isHost: false },
    { seatNo: 4, userId: 'u4', name: 'P4', isHost: false },
    { seatNo: 5, userId: 'u5', name: 'P5', isHost: false },
  ];

  const baseConfig: AvalonGameConfig = {
    ...DEFAULT_AVALON_CONFIG,
    roles: ['Merlin', 'Percival', 'Morgana', 'Assassin'],
  };

  beforeEach(() => {
    store = new Map();
    jest.clearAllMocks();
    service = new AvalonService(mockRedis as unknown as RedisService);
  });

  async function initGame(roomCode = 'ABC123') {
    await service.initializeGame(roomCode, basePlayers, baseConfig);
    return (await service.getGameState(roomCode))!;
  }

  describe('initializeGame', () => {
    it('creates game state with role_reveal phase and role assignments', async () => {
      const assignments = await service.initializeGame('ABC123', basePlayers, baseConfig);

      expect(assignments.size).toBe(5);
      const state = await service.getGameState('ABC123');
      expect(state).not.toBeNull();
      expect(state!.phase).toBe('role_reveal');
      expect(state!.players).toHaveLength(5);
      expect(state!.players[0].isHost).toBe(true);
      // Redis 状态与返回的角色分配一致
      for (const p of state!.players) {
        expect(p.role).toBe(assignments.get(p.id)!.role);
      }
    });

    it('rejects config without Merlin', async () => {
      const config: AvalonGameConfig = {
        ...baseConfig,
        roles: ['Percival', 'Morgana', 'Assassin'],
      };

      await expect(
        service.initializeGame('ABC123', basePlayers, config),
      ).rejects.toThrow('角色配置必须包含梅林(Merlin)');
      expect(await service.getGameState('ABC123')).toBeNull();
    });

    it('rejects config without Assassin', async () => {
      const config: AvalonGameConfig = {
        ...baseConfig,
        roles: ['Merlin', 'Percival', 'Morgana'],
      };

      await expect(
        service.initializeGame('ABC123', basePlayers, config),
      ).rejects.toThrow('角色配置必须包含刺客(Assassin)');
      expect(await service.getGameState('ABC123')).toBeNull();
    });

    it('stores the database game generation in Redis state', async () => {
      await service.initializeGame('ABC123', basePlayers, baseConfig, undefined, 'game-42');

      expect((await service.getGameState('ABC123'))?.generationId).toBe('game-42');
    });

    it('uses precomputed assignments instead of generating new ones', async () => {
      const precomputed = basePlayers.map((p, i) => ({
        userId: p.userId,
        role: (['Merlin', 'Percival', 'LoyalServant', 'Morgana', 'Assassin'] as const)[i],
      }));

      await service.initializeGame('ABC123', basePlayers, baseConfig, precomputed);

      const state = await service.getGameState('ABC123');
      for (const p of state!.players) {
        expect(p.role).toBe(precomputed.find(a => a.userId === p.id)!.role);
      }
      expect(state!.assassinId).toBe('u5');
      expect(state!.merlinId).toBe('u1');
    });

    it('renews the room hash TTL when touching lastActiveAt', async () => {
      // A bare hset would recreate an already-expired room hash with no expiry,
      // leaking the key until the room itself is deleted.
      await service.initializeGame('ABC123', basePlayers, baseConfig);

      expect(mockRedis.hsetWithExpire).toHaveBeenCalledWith(
        'room:ABC123',
        'lastActiveAt',
        expect.any(String),
        86400,
      );
      expect(mockRedis.hset).not.toHaveBeenCalled();
    });
  });

  describe('beginGame', () => {
    it('advances phase from role_reveal to team_building for the host', async () => {
      await initGame();

      const result = await service.beginGame('ABC123', 'u1');

      expect(result).toEqual({ success: true, phase: 'team_building', round: 1 });
      const state = await service.getGameState('ABC123');
      expect(state!.phase).toBe('team_building');
    });

    it('rejects begin from a non-host player', async () => {
      await initGame();

      const result = await service.beginGame('ABC123', 'u2');

      expect(result).toEqual({ error: '仅房主可以开始任务阶段' });
      const state = await service.getGameState('ABC123');
      expect(state!.phase).toBe('role_reveal');
    });

    it('rejects begin when not in role_reveal phase', async () => {
      await initGame();
      await service.beginGame('ABC123', 'u1');

      const result = await service.beginGame('ABC123', 'u1');

      expect(result).toEqual({ error: '当前不是身份揭示阶段' });
    });

    it('returns error when game does not exist', async () => {
      const result = await service.beginGame('NOGAME', 'u1');

      expect(result).toEqual({ error: '游戏不存在' });
    });
  });

  describe('write serialization (per-room lock)', () => {
    it('double resolveQuest only scores once', async () => {
      await initGame();
      await service.beginGame('ABC123', 'u1');

      // 推进到 quest_action：队长提议 → 全员同意
      let state = (await service.getGameState('ABC123'))!;
      const leaderId = state.players[state.leaderIndex].id;
      const teamSize = 2; // 5 人局第 1 轮
      const team = state.players.slice(0, teamSize).map(p => p.id);
      // 确保队长在队伍里不重要，提议只需人数正确
      await service.proposeTeam('ABC123', leaderId, team);
      for (const p of state.players) {
        await service.submitTeamVote('ABC123', p.id, 'approve');
      }
      const resolved = await service.resolveTeamVote('ABC123');
      expect('result' in resolved).toBe(true);

      // 队伍成员全部提交任务票
      state = (await service.getGameState('ABC123'))!;
      expect(state.phase).toBe('quest_action');
      for (const id of state.proposedTeam) {
        await service.submitQuestAction('ABC123', id, 'success');
      }

      // 并发触发两次解析（模拟弱网双提交）：一次成功，一次因阶段校验失败
      const [r1, r2] = await Promise.all([
        service.resolveQuest('ABC123'),
        service.resolveQuest('ABC123'),
      ]);

      const successes = [r1, r2].filter(r => 'result' in r);
      const errors = [r1, r2].filter(r => 'error' in r);
      expect(successes).toHaveLength(1);
      expect(errors).toHaveLength(1);
      expect((errors[0] as { error: string }).error).toBe('当前不是任务执行阶段');

      state = (await service.getGameState('ABC123'))!;
      expect(state.goodScore).toBe(1);
      expect(state.questHistory).toHaveLength(1);
    });

    it('double resolveTeamVote only resolves once', async () => {
      await initGame();
      await service.beginGame('ABC123', 'u1');

      const state = (await service.getGameState('ABC123'))!;
      const leaderId = state.players[state.leaderIndex].id;
      const team = state.players.slice(0, 2).map(p => p.id);
      await service.proposeTeam('ABC123', leaderId, team);
      for (const p of state.players) {
        await service.submitTeamVote('ABC123', p.id, 'approve');
      }

      const [r1, r2] = await Promise.all([
        service.resolveTeamVote('ABC123'),
        service.resolveTeamVote('ABC123'),
      ]);

      const successes = [r1, r2].filter(r => 'result' in r);
      const errors = [r1, r2].filter(r => 'error' in r);
      expect(successes).toHaveLength(1);
      expect(errors).toHaveLength(1);
      expect((errors[0] as { error: string }).error).toBe('当前不是投票阶段');
    });
  });

  describe('generation validation', () => {
    it('hides and rejects state from a non-active database generation', async () => {
      await service.initializeGame('ABC123', basePlayers, baseConfig, undefined, 'game-old');
      service.setGenerationValidator(async (_roomCode, generationId) => generationId === 'game-new');

      expect(await service.getGameState('ABC123')).toBeNull();
      await expect(service.beginGame('ABC123', 'u1')).resolves.toEqual({ error: '游戏不存在' });
    });
  });

  describe('lock fencing', () => {
    it('does not persist a transition after the Redis lease is lost', async () => {
      await initGame();
      mockRedis.setWithLock.mockRejectedValueOnce(new Error('LOCK_LOST'));

      await expect(service.beginGame('ABC123', 'u1')).resolves.toEqual({ error: 'LOCK_LOST' });
      expect((await service.getGameState('ABC123'))?.phase).toBe('role_reveal');
    });

    it('does not delete successor state after the Redis lease is lost', async () => {
      await initGame();
      mockRedis.delWithLock.mockRejectedValueOnce(new Error('LOCK_LOST'));

      await expect(service.deleteGameState('ABC123')).rejects.toThrow('LOCK_LOST');
      expect(await service.getGameState('ABC123')).not.toBeNull();
    });
  });

  describe('activity tracking failures', () => {
    it('does not reject a committed state transition when the activity touch fails', async () => {
      await initGame();
      mockRedis.hsetWithExpire.mockRejectedValueOnce(new Error('activity redis failure'));

      await expect(service.beginGame('ABC123', 'u1')).resolves.toMatchObject({
        success: true,
        phase: 'team_building',
      });
      expect((await service.getGameState('ABC123'))?.phase).toBe('team_building');
    });
  });

  describe('online/offline markers', () => {
    it('marks player offline and online', async () => {
      await initGame();

      await service.markPlayerOffline('ABC123', 'u2');
      let state = (await service.getGameState('ABC123'))!;
      expect(state.players.find(p => p.id === 'u2')!.isConnected).toBe(false);

      await service.markPlayerOnline('ABC123', 'u2');
      state = (await service.getGameState('ABC123'))!;
      expect(state.players.find(p => p.id === 'u2')!.isConnected).toBe(true);
    });

    it('marks nothing when the game state is missing', async () => {
      await expect(service.markPlayerOffline('NOGAME', 'u1')).resolves.toBeUndefined();
      await expect(service.markPlayerOnline('NOGAME', 'u1')).resolves.toBeUndefined();
    });
  });

  // ==================== 以下为追加的覆盖率测试（不影响以上原有用例） ====================

  function seedState(roomCode: string, state: AvalonGameState): void {
    store.set(`avalon:${roomCode}:state`, JSON.stringify(state));
  }

  function buildAssassinationState(): AvalonGameState {
    return {
      roomId: 'ABC123',
      phase: 'assassination',
      players: [
        { id: 'm1', name: 'Merlin', seatNo: 1, isHost: true, isConnected: true, role: 'Merlin', faction: 'good' },
        { id: 'p2', name: 'P2', seatNo: 2, isHost: false, isConnected: true, role: 'Percival', faction: 'good' },
        { id: 'a1', name: 'Assassin', seatNo: 3, isHost: false, isConnected: true, role: 'Assassin', faction: 'evil' },
        { id: 'p4', name: 'P4', seatNo: 4, isHost: false, isConnected: true, role: 'LoyalServant', faction: 'good' },
        { id: 'p5', name: 'P5', seatNo: 5, isHost: false, isConnected: true, role: 'Morgana', faction: 'evil' },
      ],
      config: baseConfig,
      leaderIndex: 0,
      round: 5,
      rejectedTeamVoteCount: 0,
      proposedTeam: [],
      teamVotes: {},
      questActions: {},
      questHistory: [],
      goodScore: 3,
      evilScore: 1,
      assassinId: 'a1',
      merlinId: 'm1',
      generationId: 'legacy',
    };
  }

  describe('initializeGame precomputed assignment validation', () => {
    it('rejects when the precomputed assignment count does not match the player count', async () => {
      const precomputed = [{ userId: 'u1', role: 'Merlin' as const }];

      await expect(
        service.initializeGame('ABC123', basePlayers, baseConfig, precomputed),
      ).rejects.toThrow('预计算角色分配数量(1)与玩家数量(5)不匹配');
      expect(await service.getGameState('ABC123')).toBeNull();
    });

    it('rejects when a player has no precomputed assignment', async () => {
      // 数量匹配但 userId 重复（u2 的分配被替换成 u1）→ u2 缺少角色分配
      const precomputed = basePlayers.map((p, i) => ({
        userId: i === 1 ? 'u1' : p.userId,
        role: 'LoyalServant' as const,
      }));

      await expect(
        service.initializeGame('ABC123', basePlayers, baseConfig, precomputed),
      ).rejects.toThrow('缺少玩家 u2 的角色分配');
      expect(await service.getGameState('ABC123')).toBeNull();
    });

    it('leaves assassinId/merlinId unset when precomputed roles have neither', async () => {
      // 预计算分配绕过 generateRoles 校验：没有刺客/梅林时终局字段不应被设置
      const precomputed = [
        { userId: 'u1', role: 'Percival' as const },
        { userId: 'u2', role: 'LoyalServant' as const },
        { userId: 'u3', role: 'LoyalServant' as const },
        { userId: 'u4', role: 'LoyalServant' as const },
        { userId: 'u5', role: 'Morgana' as const },
      ];

      await service.initializeGame('ABC123', basePlayers, baseConfig, precomputed);

      const state = await service.getGameState('ABC123');
      expect(state).not.toBeNull();
      expect(state!.assassinId).toBeUndefined();
      expect(state!.merlinId).toBeUndefined();
    });
  });

  describe('direct state writes without a room lock', () => {
    it('refuses saveGameState when no room lease is held', async () => {
      const state = await initGame();

      await expect(service.saveGameState('ABC123', state)).rejects.toThrow(
        'Avalon state write attempted without room lock',
      );
    });
  });

  describe('deleteGameState', () => {
    it('deletes the game state under the room lock', async () => {
      await initGame();

      await service.deleteGameState('ABC123');

      expect(await service.getGameState('ABC123')).toBeNull();
    });
  });

  describe('generation validation', () => {
    it('hides legacy state without a generationId when a validator is configured', async () => {
      await service.initializeGame('ABC123', basePlayers, baseConfig);
      const state = JSON.parse(store.get('avalon:ABC123:state')!);
      delete state.generationId;
      seedState('ABC123', state);
      service.setGenerationValidator(async () => true);

      expect(await service.getGameState('ABC123')).toBeNull();
    });

    it('keeps state whose generationId the validator accepts', async () => {
      await service.initializeGame('ABC123', basePlayers, baseConfig, undefined, 'game-new');
      service.setGenerationValidator(async (_roomCode, generationId) => generationId === 'game-new');

      const state = await service.getGameState('ABC123');

      expect(state).not.toBeNull();
      expect(state!.generationId).toBe('game-new');
    });
  });

  describe('updateHost', () => {
    it('transfers the host flag to the new host', async () => {
      await initGame();

      await service.updateHost('ABC123', 'u3');

      const state = (await service.getGameState('ABC123'))!;
      expect(state.players.find(p => p.id === 'u3')!.isHost).toBe(true);
      expect(state.players.find(p => p.id === 'u1')!.isHost).toBe(false);
    });

    it('resolves without effect when the game state is missing', async () => {
      await expect(service.updateHost('NOGAME', 'u1')).resolves.toBeUndefined();
    });

    it('rejects a new host who is not in the game', async () => {
      await initGame();

      await expect(service.updateHost('ABC123', 'uX')).rejects.toThrow('新房主不在本局游戏中');
    });
  });

  describe('player views', () => {
    it('returns the requesting player view', async () => {
      await initGame();

      const view = await service.getPlayerView('ABC123', 'u1');

      expect(view).not.toBeNull();
      expect(view!.myId).toBe('u1');
      expect(view!.myRole).toBeDefined();
      expect(view!.players).toHaveLength(5);
    });

    it('returns null when the game state is missing', async () => {
      expect(await service.getPlayerView('NOGAME', 'u1')).toBeNull();
    });

    it('builds one view per player', async () => {
      await initGame();

      const views = await service.getAllPlayerViews('ABC123');

      expect(views.size).toBe(5);
      expect(views.get('u2')!.myId).toBe('u2');
      expect(views.get('u2')!.myRole).toBeDefined();
    });

    it('returns an empty map when the game state is missing', async () => {
      expect((await service.getAllPlayerViews('NOGAME')).size).toBe(0);
    });
  });

  describe('action error mapping', () => {
    it('maps engine rejections to { error } results for proposeTeam', async () => {
      await initGame();
      await service.beginGame('ABC123', 'u1');
      const state = (await service.getGameState('ABC123'))!;
      const notLeader = state.players[(state.leaderIndex + 1) % state.players.length].id;
      const team = state.players.slice(0, 2).map(p => p.id);

      await expect(service.proposeTeam('ABC123', notLeader, team)).resolves.toEqual({
        error: '你不是当前队长',
      });
    });

    it('maps engine rejections to { error } results for submitTeamVote', async () => {
      await initGame();

      await expect(service.submitTeamVote('ABC123', 'u1', 'approve')).resolves.toEqual({
        error: '当前不是投票阶段',
      });
    });

    it('maps engine rejections to { error } results for submitQuestAction', async () => {
      await initGame();

      await expect(service.submitQuestAction('ABC123', 'u1', 'success')).resolves.toEqual({
        error: '当前不是任务执行阶段',
      });
    });

    it('returns 游戏不存在 for every write when the game state is missing', async () => {
      await expect(service.proposeTeam('NOGAME', 'u1', ['u1'])).resolves.toEqual({ error: '游戏不存在' });
      await expect(service.submitTeamVote('NOGAME', 'u1', 'approve')).resolves.toEqual({ error: '游戏不存在' });
      await expect(service.submitQuestAction('NOGAME', 'u1', 'success')).resolves.toEqual({ error: '游戏不存在' });
      await expect(service.resolveTeamVote('NOGAME')).resolves.toEqual({ error: '游戏不存在' });
      await expect(service.resolveQuest('NOGAME')).resolves.toEqual({ error: '游戏不存在' });
      await expect(service.assassinate('NOGAME', 'a1', 'm1')).resolves.toEqual({ error: '游戏不存在' });
      await expect(service.beginGame('NOGAME', 'u1')).resolves.toEqual({ error: '游戏不存在' });
    });
  });

  describe('assassinate', () => {
    it('resolves a successful assassination of Merlin', async () => {
      seedState('ABC123', buildAssassinationState());

      const result = await service.assassinate('ABC123', 'a1', 'm1');

      expect('result' in result).toBe(true);
      expect((result as { result: { winner: string } }).result.winner).toBe('evil');
      const state = (await service.getGameState('ABC123'))!;
      expect(state.phase).toBe('finished');
      expect(state.winner).toBe('evil');
      expect(state.assassinatedPlayerId).toBe('m1');
    });

    it('builds a view per player from the new state', async () => {
      seedState('ABC123', buildAssassinationState());

      const result = await service.assassinate('ABC123', 'a1', 'p2');

      expect('result' in result).toBe(true);
      expect((result as { result: { winner: string } }).result.winner).toBe('good');
      expect((result as { views: Map<string, unknown> }).views.size).toBe(5);
    });

    it('maps engine rejections to { error } results', async () => {
      seedState('ABC123', buildAssassinationState());

      await expect(service.assassinate('ABC123', 'm1', 'a1')).resolves.toEqual({
        error: '只有刺客可以执行刺杀',
      });
    });
  });

  describe('completion and leader queries', () => {
    it('isTeamVoteComplete reflects vote progress', async () => {
      const state = buildAssassinationState();
      state.phase = 'team_voting';
      seedState('ABC123', state);
      expect(await service.isTeamVoteComplete('ABC123')).toBe(false);

      state.teamVotes = { m1: 'approve', p2: 'approve', a1: 'approve', p4: 'reject', p5: 'approve' };
      seedState('ABC123', state);
      expect(await service.isTeamVoteComplete('ABC123')).toBe(true);
    });

    it('isTeamVoteComplete returns false when the game state is missing', async () => {
      expect(await service.isTeamVoteComplete('NOGAME')).toBe(false);
    });

    it('isQuestComplete reflects submitted quest actions', async () => {
      const state = buildAssassinationState();
      state.phase = 'quest_action';
      state.proposedTeam = ['m1', 'p2'];
      seedState('ABC123', state);
      expect(await service.isQuestComplete('ABC123')).toBe(false);

      state.questActions = { m1: 'success', p2: 'success' };
      seedState('ABC123', state);
      expect(await service.isQuestComplete('ABC123')).toBe(true);
    });

    it('isQuestComplete returns false when the game state is missing', async () => {
      expect(await service.isQuestComplete('NOGAME')).toBe(false);
    });

    it('getCurrentLeaderId returns the current leader', async () => {
      const state = buildAssassinationState();
      seedState('ABC123', state);

      expect(await service.getCurrentLeaderId('ABC123')).toBe(state.players[state.leaderIndex].id);
    });

    it('getCurrentLeaderId returns null when the game state is missing', async () => {
      expect(await service.getCurrentLeaderId('NOGAME')).toBeNull();
    });
  });
});
