import { randomInt } from 'node:crypto';
import { z } from 'zod';

export const SgsRoleConfigSchema = z.object({
  monarch: z.number().int().min(0).max(1).default(1),
  loyalist: z.number().int().min(0).max(5).default(0),
  rebel: z.number().int().min(0).max(8).default(0),
  traitor: z.number().int().min(0).max(3).default(0),
});

export type SgsRoleConfig = z.infer<typeof SgsRoleConfigSchema>;

export const SGS_MIN_PLAYERS = 2;
export const SGS_MAX_PLAYERS = 8;

export interface SgsRoleAssignment {
  seatNo: number;
  userId: string;
  role: string;
  team: 'monarch' | 'rebel' | 'traitor';
}

export const SGS_DEFAULT_CONFIGS: Record<number, SgsRoleConfig> = {
  2: { monarch: 1, loyalist: 0, rebel: 1, traitor: 0 },
  3: { monarch: 1, loyalist: 0, rebel: 2, traitor: 0 },
  4: { monarch: 0, loyalist: 2, rebel: 2, traitor: 0 },
  5: { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 },
  6: { monarch: 1, loyalist: 1, rebel: 3, traitor: 1 },
  7: { monarch: 1, loyalist: 2, rebel: 3, traitor: 1 },
  8: { monarch: 1, loyalist: 2, rebel: 4, traitor: 1 },
};

export function getSgsDefaultConfig(playerCount: number): SgsRoleConfig {
  const raw = Number(playerCount);
  const floored = Number.isFinite(raw) ? Math.floor(raw) : SGS_MIN_PLAYERS;
  const n = Math.min(SGS_MAX_PLAYERS, Math.max(SGS_MIN_PLAYERS, floored));
  return SGS_DEFAULT_CONFIGS[n] ?? SGS_DEFAULT_CONFIGS[SGS_MIN_PLAYERS];
}

export function assignSgsRoles(
  players: { seatNo: number; userId: string }[],
  config?: SgsRoleConfig,
): SgsRoleAssignment[] {
  const playerCount = players.length;
  const resolvedConfig = config ?? getSgsDefaultConfig(playerCount);

  const totalRoles = resolvedConfig.monarch + resolvedConfig.loyalist
    + resolvedConfig.rebel + resolvedConfig.traitor;

  if (totalRoles !== playerCount) {
    throw new Error(`角色总数(${totalRoles})与玩家数量(${playerCount})不匹配`);
  }

  const rolePool: { role: string; team: 'monarch' | 'rebel' | 'traitor' }[] = [];

  for (let i = 0; i < resolvedConfig.monarch; i++) {
    rolePool.push({ role: '主公', team: 'monarch' });
  }
  for (let i = 0; i < resolvedConfig.loyalist; i++) {
    rolePool.push({ role: '忠臣', team: 'monarch' });
  }
  for (let i = 0; i < resolvedConfig.rebel; i++) {
    rolePool.push({ role: '反贼', team: 'rebel' });
  }
  for (let i = 0; i < resolvedConfig.traitor; i++) {
    rolePool.push({ role: '内奸', team: 'traitor' });
  }

  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
  }

  return players.map((player, idx) => ({
    seatNo: player.seatNo,
    userId: player.userId,
    role: rolePool[idx].role,
    team: rolePool[idx].team,
  }));
}
