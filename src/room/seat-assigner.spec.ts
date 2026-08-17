import { BadRequestException } from '@nestjs/common';
import { assignSeat } from './seat-assigner';

describe('assignSeat', () => {
  function buildTx(occupiedSeats: number[], createImpl?: jest.Mock) {
    return {
      roomPlayer: {
        findMany: jest.fn().mockResolvedValue(occupiedSeats.map((seatNo) => ({ seatNo }))),
        create:
          createImpl
          ?? jest.fn().mockImplementation(async ({ data }: any) => ({
            id: 'p-1',
            roomId: data.roomId,
            userId: data.userId,
            seatNo: data.seatNo,
            joinedAt: new Date(),
          })),
      },
    } as any;
  }

  it('fills the lowest free seat', async () => {
    // Arrange
    const tx = buildTx([1, 2, 4]);

    // Act
    const player = await assignSeat(tx, 'room-1', 'u-new', 5);

    // Assert
    expect(player.seatNo).toBe(3);
  });

  it('rejects when every seat up to maxPlayers is taken', async () => {
    // Arrange
    const tx = buildTx([1, 2, 3]);

    // Act + Assert
    await expect(assignSeat(tx, 'room-1', 'u-new', 3)).rejects.toThrow(
      new BadRequestException('房间已满'),
    );
    expect(tx.roomPlayer.create).not.toHaveBeenCalled();
  });

  it('reports a re-join when the player already holds a seat', async () => {
    // Arrange
    const create = jest.fn().mockRejectedValue(
      Object.assign(new Error('unique'), { code: 'P2002', meta: { target: ['roomId', 'userId'] } }),
    );
    const tx = buildTx([1], create);

    // Act + Assert
    await expect(assignSeat(tx, 'room-1', 'u-dup', 5)).rejects.toThrow(
      new BadRequestException('你已经在房间中'),
    );
  });

  it('surfaces a seat collision as a retryable business error, without retrying in-transaction', async () => {
    // Arrange: on Postgres the unique violation has already aborted the
    // transaction, so retrying here would only fail with 25P02.
    const create = jest.fn().mockRejectedValue(
      Object.assign(new Error('unique'), { code: 'P2002', meta: { target: ['roomId', 'seatNo'] } }),
    );
    const tx = buildTx([1], create);

    // Act + Assert
    await expect(assignSeat(tx, 'room-1', 'u-new', 5)).rejects.toThrow(
      new BadRequestException('座位分配失败，请重试'),
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(tx.roomPlayer.findMany).toHaveBeenCalledTimes(1);
  });

  it('rethrows unrelated database errors untouched', async () => {
    // Arrange
    const dbError = Object.assign(new Error('connection lost'), { code: 'P1001' });
    const tx = buildTx([], jest.fn().mockRejectedValue(dbError));

    // Act + Assert
    await expect(assignSeat(tx, 'room-1', 'u-new', 5)).rejects.toBe(dbError);
  });
});
