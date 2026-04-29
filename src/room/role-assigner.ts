import { RoleConfig } from './role-config.schema';

export interface AvalonRoleConfig {
  merlin: boolean;
  percival: boolean;
  mordred: boolean;
  morgana: boolean;
  oberon: boolean;
  assassin: boolean;
  loyalServants: number;
  minions: number;
}

export interface RoleAssignment {
  seatNo: number;
  userId: string;
  role: string;
  team: 'good' | 'evil';
}

export function assignRoles(
  players: { seatNo: number; userId: string }[],
  config: AvalonRoleConfig,
): RoleAssignment[] {
  const rolePool: { role: string; team: 'good' | 'evil' }[] = [];

  if (config.merlin) rolePool.push({ role: '梅林', team: 'good' });
  if (config.percival) rolePool.push({ role: '派西维尔', team: 'good' });
  if (config.mordred) rolePool.push({ role: '莫德雷德', team: 'evil' });
  if (config.morgana) rolePool.push({ role: '莫甘娜', team: 'evil' });
  if (config.oberon) rolePool.push({ role: '奥伯伦', team: 'evil' });
  if (config.assassin) rolePool.push({ role: '刺客', team: 'evil' });

  for (let i = 0; i < config.loyalServants; i++) {
    rolePool.push({ role: '忠臣', team: 'good' });
  }
  for (let i = 0; i < config.minions; i++) {
    rolePool.push({ role: '爪牙', team: 'evil' });
  }

  if (rolePool.length !== players.length) {
    throw new Error('角色数量与玩家数量不匹配');
  }

  // Fisher-Yates 洗牌
  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
  }

  return players.map((player, idx) => ({
    seatNo: player.seatNo,
    userId: player.userId,
    role: rolePool[idx].role,
    team: rolePool[idx].team,
  }));
}
