import { DEFAULT_ROLE_CONFIGS, getDefaultConfig, roleConfigSchema } from './role-config.schema';

describe('role-config.schema', () => {
  describe('getDefaultConfig', () => {
    it('returns the preset matching the player count', () => {
      expect(getDefaultConfig(5)).toEqual(DEFAULT_ROLE_CONFIGS[5]);
      expect(getDefaultConfig(7)).toEqual(DEFAULT_ROLE_CONFIGS[7]);
      expect(getDefaultConfig(10)).toEqual(DEFAULT_ROLE_CONFIGS[10]);
    });

    it('falls back to the 5-player preset for unknown counts', () => {
      expect(getDefaultConfig(4)).toEqual(DEFAULT_ROLE_CONFIGS[5]);
      expect(getDefaultConfig(11)).toEqual(DEFAULT_ROLE_CONFIGS[5]);
      expect(getDefaultConfig(Number.NaN)).toEqual(DEFAULT_ROLE_CONFIGS[5]);
    });
  });

  describe('roleConfigSchema', () => {
    it('applies defaults to an empty partial config', () => {
      expect(roleConfigSchema.parse({})).toEqual({
        merlin: false,
        percival: false,
        mordred: false,
        morgana: false,
        oberon: false,
        assassin: false,
        loyalServants: 0,
        minions: 0,
      });
    });

    it('keeps provided values and coerces nothing silently', () => {
      expect(roleConfigSchema.parse({ merlin: true, loyalServants: 3 })).toEqual({
        merlin: true,
        percival: false,
        mordred: false,
        morgana: false,
        oberon: false,
        assassin: false,
        loyalServants: 3,
        minions: 0,
      });
    });

    it('rejects out-of-range or non-integer counts', () => {
      expect(() => roleConfigSchema.parse({ loyalServants: -1 })).toThrow();
      expect(() => roleConfigSchema.parse({ minions: 11 })).toThrow();
      expect(() => roleConfigSchema.parse({ loyalServants: 1.5 })).toThrow();
    });
  });
});
