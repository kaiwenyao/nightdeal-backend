import { assignSgsRoles, getSgsDefaultConfig, SGS_DEFAULT_CONFIGS } from './sgs-role-assigner';

describe('SgsRoleAssigner', () => {
  describe('getSgsDefaultConfig', () => {
    it('should return correct config for 5 players', () => {
      expect(getSgsDefaultConfig(5)).toEqual({ monarch: 1, loyalist: 1, rebel: 2, traitor: 1 });
    });

    it('should return correct config for 8 players', () => {
      expect(getSgsDefaultConfig(8)).toEqual({ monarch: 1, loyalist: 2, rebel: 4, traitor: 1 });
    });

    it('should return correct config for 10 players', () => {
      expect(getSgsDefaultConfig(10)).toEqual({ monarch: 1, loyalist: 3, rebel: 4, traitor: 2 });
    });

    it('should fallback to 5-player config for unsupported counts', () => {
      expect(getSgsDefaultConfig(3)).toEqual(SGS_DEFAULT_CONFIGS[5]);
      expect(getSgsDefaultConfig(11)).toEqual(SGS_DEFAULT_CONFIGS[5]);
    });
  });

  describe('assignSgsRoles', () => {
    it('should throw error when role count does not match player count', () => {
      const players = [{ seatNo: 1, userId: 'user1' }];
      const config = { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 };

      expect(() => assignSgsRoles(players, config)).toThrow('角色总数(5)与玩家数量(1)不匹配');
    });

    it('should assign roles correctly for 5 players', () => {
      const players = [
        { seatNo: 1, userId: 'user1' },
        { seatNo: 2, userId: 'user2' },
        { seatNo: 3, userId: 'user3' },
        { seatNo: 4, userId: 'user4' },
        { seatNo: 5, userId: 'user5' },
      ];

      const result = assignSgsRoles(players);

      expect(result).toHaveLength(5);
      expect(result.filter(r => r.role === '主公')).toHaveLength(1);
      expect(result.filter(r => r.role === '忠臣')).toHaveLength(1);
      expect(result.filter(r => r.role === '反贼')).toHaveLength(2);
      expect(result.filter(r => r.role === '内奸')).toHaveLength(1);
    });

    it('should assign roles correctly for 8 players', () => {
      const players = Array.from({ length: 8 }, (_, i) => ({
        seatNo: i + 1,
        userId: `user${i + 1}`,
      }));

      const result = assignSgsRoles(players);

      expect(result).toHaveLength(8);
      expect(result.filter(r => r.role === '主公')).toHaveLength(1);
      expect(result.filter(r => r.role === '忠臣')).toHaveLength(2);
      expect(result.filter(r => r.role === '反贼')).toHaveLength(4);
      expect(result.filter(r => r.role === '内奸')).toHaveLength(1);
    });

    it('should assign correct team affiliations', () => {
      const players = Array.from({ length: 5 }, (_, i) => ({
        seatNo: i + 1,
        userId: `user${i + 1}`,
      }));

      const result = assignSgsRoles(players);

      const monarch = result.find(r => r.role === '主公');
      const loyalist = result.find(r => r.role === '忠臣');
      const rebel = result.find(r => r.role === '反贼');
      const traitor = result.find(r => r.role === '内奸');

      expect(monarch?.team).toBe('monarch');
      expect(loyalist?.team).toBe('monarch');
      expect(rebel?.team).toBe('rebel');
      expect(traitor?.team).toBe('traitor');
    });

    it('should shuffle roles randomly', () => {
      const players = Array.from({ length: 5 }, (_, i) => ({
        seatNo: i + 1,
        userId: `user${i + 1}`,
      }));

      const results = new Set();
      for (let i = 0; i < 100; i++) {
        const result = assignSgsRoles(players);
        results.add(result.map(r => r.role).join(','));
      }

      expect(results.size).toBeGreaterThan(1);
    });

    it('should preserve seat numbers and user IDs', () => {
      const players = [
        { seatNo: 1, userId: 'user1' },
        { seatNo: 2, userId: 'user2' },
        { seatNo: 3, userId: 'user3' },
        { seatNo: 4, userId: 'user4' },
        { seatNo: 5, userId: 'user5' },
      ];

      const result = assignSgsRoles(players);

      result.forEach((assignment, index) => {
        expect(assignment.seatNo).toBe(players[index].seatNo);
        expect(assignment.userId).toBe(players[index].userId);
      });
    });

    it('should use provided config instead of default', () => {
      const players = [
        { seatNo: 1, userId: 'user1' },
        { seatNo: 2, userId: 'user2' },
        { seatNo: 3, userId: 'user3' },
        { seatNo: 4, userId: 'user4' },
        { seatNo: 5, userId: 'user5' },
      ];
      const customConfig = { monarch: 1, loyalist: 2, rebel: 1, traitor: 1 };

      const result = assignSgsRoles(players, customConfig);

      expect(result.filter(r => r.role === '忠臣')).toHaveLength(2);
      expect(result.filter(r => r.role === '反贼')).toHaveLength(1);
    });
  });
});
