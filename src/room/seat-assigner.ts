import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';

/**
 * Assign the lowest free seat to a player. MUST be called with the transaction
 * client from an open `$transaction` callback (while holding the room row lock)
 * so the seat read + create participate in the caller's transaction — passing
 * the root PrismaService would commit outside it and break capacity checks.
 *
 * There is no in-place retry on a seat collision: on Postgres a unique-constraint
 * violation aborts the enclosing transaction, so any follow-up query would fail
 * with 25P02 instead of retrying. The caller holds the room row lock, which
 * already serializes joins; a collision here means that invariant broke, and the
 * honest response is to fail the transaction and let the client retry.
 */
export async function assignSeat(
  tx: Prisma.TransactionClient,
  roomId: string,
  userId: string,
  maxPlayers: number,
): Promise<{ id: string; seatNo: number; roomId: string; userId: string; joinedAt: Date }> {
  const occupiedSeats = await tx.roomPlayer.findMany({
    where: { roomId },
    select: { seatNo: true },
    orderBy: { seatNo: 'asc' },
  });

  const occupiedSet = new Set(occupiedSeats.map((s) => s.seatNo));
  let seatNo = 1;
  while (seatNo <= maxPlayers && occupiedSet.has(seatNo)) {
    seatNo++;
  }

  if (seatNo > maxPlayers) {
    throw new BadRequestException('房间已满');
  }

  try {
    return await tx.roomPlayer.create({
      data: { roomId, userId, seatNo },
    });
  } catch (e: any) {
    if (e.code === 'P2002' && e.meta?.target) {
      const target: string[] = e.meta.target;
      // Player already exists in this room — re-join scenario, not a seat collision
      if (target.includes('userId')) {
        throw new BadRequestException('你已经在房间中');
      }
      // Seat collision despite the room row lock — surface it as a retryable
      // business error instead of a 500 (the transaction is already aborted).
      if (target.includes('seatNo')) {
        throw new BadRequestException('座位分配失败，请重试');
      }
    }
    throw e;
  }
}
