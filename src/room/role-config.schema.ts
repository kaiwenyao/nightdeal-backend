import { z } from 'zod';

export const roleConfigSchema = z.object({
  merlin: z.boolean().default(false),
  percival: z.boolean().default(false),
  mordred: z.boolean().default(false),
  morgana: z.boolean().default(false),
  oberon: z.boolean().default(false),
  assassin: z.boolean().default(false),
  loyalServants: z.number().int().min(0).max(4).default(0),
  minions: z.number().int().min(0).max(4).default(0),
});

export type RoleConfig = z.infer<typeof roleConfigSchema>;
