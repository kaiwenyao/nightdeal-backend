import { assignRoles, AvalonRoleConfig } from './role-assigner';

describe('RoleAssigner', () => {
  describe('assignRoles', () => {
    it('should throw error when role count mismatch player count', () => {
      const players = [{ seatNo: 1, userId: 'user1' }];
      const config: AvalonRoleConfig = {
        merlin: true,
        percival: true,
        mordred: false,
        morgana: false,
        oberon: false,
        assassin: false,
        loyalServants: 0,
        minions: 0,
      };

      expect(() => assignRoles(players, config)).toThrow('角色数量与玩家数量不匹配');
    });

    it('should assign roles correctly for 5 players', () => {
      const players = [
        { seatNo: 1, userId: 'user1' },
        { seatNo: 2, userId: 'user2' },
        { seatNo: 3, userId: 'user3' },
        { seatNo: 4, userId: 'user4' },
        { seatNo: 5, userId: 'user5' },
      ];
      const config: AvalonRoleConfig = {
        merlin: true,
        percival: true,
        mordred: false,
        morgana: true,
        oberon: false,
        assassin: true,
        loyalServants: 1,
        minions: 0,
      };

      const result = assignRoles(players, config);

      expect(result).toHaveLength(5);
      expect(result.filter(r => r.team === 'good')).toHaveLength(3);
      expect(result.filter(r => r.team === 'evil')).toHaveLength(2);
    });

    it('should assign all specified roles', () => {
      const players = [
        { seatNo: 1, userId: 'user1' },
        { seatNo: 2, userId: 'user2' },
        { seatNo: 3, userId: 'user3' },
        { seatNo: 4, userId: 'user4' },
        { seatNo: 5, userId: 'user5' },
      ];
      const config: AvalonRoleConfig = {
        merlin: true,
        percival: true,
        mordred: false,
        morgana: true,
        oberon: false,
        assassin: true,
        loyalServants: 1,
        minions: 0,
      };

      const result = assignRoles(players, config);
      const roles = result.map(r => r.role);

      expect(roles).toContain('梅林');
      expect(roles).toContain('派西维尔');
      expect(roles).toContain('莫甘娜');
      expect(roles).toContain('刺客');
      expect(roles).toContain('忠臣');
    });

    it('should shuffle roles randomly', () => {
      const players = Array.from({ length: 5 }, (_, i) => ({
        seatNo: i + 1,
        userId: `user${i + 1}`,
      }));
      const config: AvalonRoleConfig = {
        merlin: true,
        percival: true,
        mordred: false,
        morgana: true,
        oberon: false,
        assassin: true,
        loyalServants: 1,
        minions: 0,
      };

      const results = new Set();
      for (let i = 0; i < 100; i++) {
        const result = assignRoles(players, config);
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
      const config: AvalonRoleConfig = {
        merlin: true,
        percival: true,
        mordred: false,
        morgana: true,
        oberon: false,
        assassin: true,
        loyalServants: 1,
        minions: 0,
      };

      const result = assignRoles(players, config);

      result.forEach((assignment, index) => {
        expect(assignment.seatNo).toBe(players[index].seatNo);
        expect(assignment.userId).toBe(players[index].userId);
      });
    });
  });
});
