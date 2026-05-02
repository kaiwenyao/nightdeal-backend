import { z } from 'zod';

export const roleConfigSchema = z.object({
  merlin: z.boolean().default(false),
  percival: z.boolean().default(false),
  mordred: z.boolean().default(false),
  morgana: z.boolean().default(false),
  oberon: z.boolean().default(false),
  assassin: z.boolean().default(false),
  loyalServants: z.number().int().min(0).max(10).default(0),
  minions: z.number().int().min(0).max(10).default(0),
});

export type RoleConfig = z.infer<typeof roleConfigSchema>;

/**
 * Partial role config for API input — all fields optional since
 * clients may only want to override a subset of roles.
 *
 * Note: This is a type-level convenience only. The service layer does
 * NOT auto-merge partial configs with defaults. Callers must either
 * provide a complete config or manually merge with `getDefaultConfig()`
 * before passing to service methods.
 */
export type PartialRoleConfig = Partial<RoleConfig>;

/** 标准局预设；7 人默认奥伯伦（也可用 settings 关奥伯伦、minions:1 换成普通爪牙）。 */
export const DEFAULT_ROLE_CONFIGS: Record<number, RoleConfig> = {
  5: { merlin: true, percival: true, mordred: false, morgana: true, oberon: false, assassin: true, loyalServants: 1, minions: 0 },
  6: { merlin: true, percival: true, mordred: false, morgana: true, oberon: false, assassin: true, loyalServants: 2, minions: 0 },
  7: { merlin: true, percival: true, mordred: false, morgana: true, oberon: true, assassin: true, loyalServants: 2, minions: 0 },
  8: { merlin: true, percival: true, mordred: false, morgana: true, oberon: false, assassin: true, loyalServants: 3, minions: 1 },
  9: { merlin: true, percival: true, mordred: true, morgana: true, oberon: false, assassin: true, loyalServants: 4, minions: 0 },
  10: { merlin: true, percival: true, mordred: true, morgana: true, oberon: true, assassin: true, loyalServants: 4, minions: 0 },
};

export function getDefaultConfig(playerCount: number): RoleConfig {
  return DEFAULT_ROLE_CONFIGS[playerCount] ?? DEFAULT_ROLE_CONFIGS[5];
}
