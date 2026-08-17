import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetPlayerViewDto, SubmitTeamVoteDto } from './index';

describe('Avalon room-code DTOs', () => {
  it('normalizes lowercase room codes before validation', async () => {
    const dto = plainToInstance(GetPlayerViewDto, { roomCode: ' abcdef ' });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.roomCode).toBe('ABCDEF');
  });

  it('rejects malformed room codes on every inherited DTO', async () => {
    const dto = plainToInstance(SubmitTeamVoteDto, {
      roomCode: 'bad!',
      vote: 'approve',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
