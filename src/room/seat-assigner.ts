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
      if (e.code === 'P2002') continue;
      throw e;
    }
  }
  throw new Error('座位分配失败，请重试');
}
