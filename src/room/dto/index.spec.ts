import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GameType } from '../../../prisma/generated/prisma/client.js';
import { CreateRoomDto } from './index';

describe('CreateRoomDto', () => {
  it('accepts SGS with maxPlayers 2', async () => {
    const dto = plainToInstance(CreateRoomDto, { gameType: GameType.SGS, maxPlayers: 2 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects maxPlayers below 2', async () => {
    const dto = plainToInstance(CreateRoomDto, { gameType: GameType.SGS, maxPlayers: 1 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'maxPlayers')).toBe(true);
  });

  it('rejects maxPlayers above 10', async () => {
    const dto = plainToInstance(CreateRoomDto, { gameType: GameType.AVALON, maxPlayers: 11 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'maxPlayers')).toBe(true);
  });
});
