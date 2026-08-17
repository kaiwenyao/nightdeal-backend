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
  });
});
