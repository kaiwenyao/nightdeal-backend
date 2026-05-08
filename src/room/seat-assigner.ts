import { PrismaService } from '../prisma/prisma.service';

export async function assignSeat(
  prisma: PrismaService,
  roomId: string,
  userId: string,
  maxPlayers: number,
): Promise<{ id: string; seatNo: number; roomId: string; userId: string; joinedAt: Date }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const occupiedSeats = await prisma.roomPlayer.findMany({
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
      throw new Error('房间已满');
    }

    try {
      return await prisma.roomPlayer.create({
        data: { roomId, userId, seatNo },
      });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target) {
        const target: string[] = e.meta.target;
        // Player already exists in this room — re-join scenario, not a seat collision
        if (target.includes('userId')) {
          throw new Error('你已经在房间中');
        }
        // Seat number collision — retry with a different seat
        if (target.includes('seatNo')) {
          continue;
        }
      }
      throw e;
    }
  }
  throw new Error('座位分配失败，请重试');
}
