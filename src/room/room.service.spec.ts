import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from './room.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PartialRoleConfig } from './role-config.schema';
import { GameType } from '../../prisma/generated/prisma/client.js';

describe('RoomService', () => {
  let service: RoomService;

  const mockPrisma = {
    room: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    roomPlayer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    gameRecord: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRedis = {
    hset: jest.fn().mockResolvedValue(undefined),
    hsetWithExpire: jest.fn().mockResolvedValue(undefined),
    hget: jest.fn().mockResolvedValue(null),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    expire: jest.fn().mockResolvedValue(undefined),
    withLock: jest.fn().mockImplementation(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
    mockPrisma.gameRecord.create.mockResolvedValue({ id: 'game-1' });
    mockPrisma.gameRecord.findFirst.mockResolvedValue({ id: 'game-1' });
    mockPrisma.gameRecord.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.roomPlayer.deleteMany.mockResolvedValue({ count: 1 });
    mockRedis.withLock.mockImplementation(async (key: string, _ttl: number, fn: (lease: unknown) => Promise<unknown>) => fn({ key, token: 'test-token' }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  describe('createRoom', () => {
    it('with valid roleConfig returns RoomInfo', async () => {
      const mockRoom = {
        id: 'room-1',
        code: 'ABCDEF',
        hostId: 'host-1',
        status: 'WAITING',
        roleConfig: { merlin: true, percival: true, loyalServants: 3, minions: 3 },
        maxPlayers: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.room.findUnique.mockResolvedValue(null);
      mockPrisma.room.create.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.create.mockResolvedValue({
        id: 'player-1',
        roomId: 'room-1',
        userId: 'host-1',
        seatNo: 1,
        joinedAt: new Date(),
      });

      const result = await service.createRoom('host-1', { merlin: true, percival: true, loyalServants: 3, minions: 3 } as PartialRoleConfig, 8);

      expect(result).toMatchObject({
        id: 'room-1',
        code: 'ABCDEF',
        hostId: 'host-1',
        maxPlayers: 8,
      });
      expect(mockPrisma.room.create).toHaveBeenCalled();
      expect(mockPrisma.roomPlayer.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-1',
          userId: 'host-1',
          seatNo: 1,
        },
      });
      // lastActiveAt is written together with the TTL, so an expired hash can
      // never be resurrected without an expiry.
      expect(mockRedis.hsetWithExpire).toHaveBeenCalledWith(
        expect.stringMatching(/^room:[A-Z]{6}$/),
        'lastActiveAt',
        expect.any(String),
        86400,
      );
      expect(mockRedis.hsetWithExpire).not.toHaveBeenCalledWith(expect.anything(), 'status', expect.anything(), expect.anything());
      expect(mockRedis.hsetWithExpire).not.toHaveBeenCalledWith(expect.anything(), 'hostId', expect.anything(), expect.anything());
      expect(mockRedis.hsetWithExpire).not.toHaveBeenCalledWith(expect.anything(), 'playerCount', expect.anything(), expect.anything());
      expect(mockRedis.hset).not.toHaveBeenCalled();
    });

    it('rejects Avalon when maxPlayers below minimum', async () => {
      const result = await service.createRoom('host-1', undefined, 4, GameType.AVALON);

      expect(result).toEqual({ error: '房间人数需在 5-10 人之间' });
    });

    it('rejects SGS when maxPlayers above 8', async () => {
      const result = await service.createRoom('host-1', undefined, 9, GameType.SGS);

      expect(result).toEqual({ error: '房间人数需在 2-8 人之间' });
    });

    it('accepts SGS with maxPlayers 2', async () => {
      const mockSgsRoom = {
        id: 'room-sgs',
        code: 'SGS001',
        hostId: 'host-1',
        status: 'WAITING',
        gameType: GameType.SGS,
        roleConfig: { monarch: 1, loyalist: 0, rebel: 1, traitor: 0 },
        maxPlayers: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.room.findUnique.mockResolvedValue(null);
      mockPrisma.room.create.mockResolvedValue(mockSgsRoom);
      mockPrisma.roomPlayer.create.mockResolvedValue({
        id: 'player-1',
        roomId: 'room-sgs',
        userId: 'host-1',
        seatNo: 1,
        joinedAt: new Date(),
      });

      const result = await service.createRoom('host-1', undefined, 2, GameType.SGS);

      expect(result).not.toHaveProperty('error');
      expect(result).toMatchObject({ maxPlayers: 2, gameType: GameType.SGS });
    });

    it('with invalid roleConfig returns { error }', async () => {
      const invalidConfig = { loyalServants: 99 };

      const result = await service.createRoom('host-1', invalidConfig as PartialRoleConfig);

      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('角色配置格式无效');
    });

    it('with loyalServants > 10 returns error', async () => {
      const invalidConfig = { loyalServants: 11 };

      const result = await service.createRoom('host-1', invalidConfig as PartialRoleConfig);

      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('角色配置格式无效');
    });
  });

  describe('updateRoomSettings', () => {
    const mockRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'WAITING',
      gameType: GameType.AVALON,
      roleConfig: { merlin: true, percival: false, mordred: false, morgana: false, oberon: false, assassin: false, loyalServants: 4, minions: 0 },
      maxPlayers: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('as host with valid data returns updated room', async () => {
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(mockRoom)     // getRoom check
        .mockResolvedValueOnce(mockRoom)     // getRoom inside getPlayerCount
        .mockResolvedValueOnce({ ...mockRoom, maxPlayers: 10 }); // getRoom return refreshed
      mockPrisma.roomPlayer.count.mockResolvedValue(3);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 10,
        roleConfig: { merlin: true, percival: true, loyalServants: 4, minions: 4 } as PartialRoleConfig,
      });

      expect(result).toHaveProperty('maxPlayers', 10);
      expect(mockPrisma.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'WAITING', hostId: 'host-1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('returns error when the update races a game start (status flip affected 0 rows)', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.room.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        isRandomSeat: true,
      });

      expect(result).toEqual({ error: '游戏已开始或房主已变更，无法修改设置' });
    });

    it('rejects non-host', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);

      const result = await service.updateRoomSettings('ABCDEF', 'not-host', {
        maxPlayers: 10,
      });

      expect(result).toEqual({ error: '仅房主可以修改设置' });
    });

    it('rejects maxPlayers < current player count', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.count.mockResolvedValue(6);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 4,
      });

      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('当前已有6名玩家');
      expect((result as any).error).toContain('无法减少至4人');
    });

    it('rejects Avalon maxPlayers below game minimum when above player count', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.count.mockResolvedValue(3);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 4,
      });

      expect(result).toEqual({ error: '房间人数需在 5-10 人之间' });
    });

    it('rejects SGS room when maxPlayers above 8', async () => {
      const sgsRoom = {
        ...mockRoom,
        gameType: GameType.SGS,
        roleConfig: { monarch: 1, loyalist: 2, rebel: 4, traitor: 1 },
        maxPlayers: 8,
      };
      mockPrisma.room.findUnique.mockResolvedValue(sgsRoom);
      mockPrisma.roomPlayer.count.mockResolvedValue(3);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 9,
      });

      expect(result).toEqual({ error: '房间人数需在 2-8 人之间' });
    });

    it('allows SGS room to set maxPlayers to 2', async () => {
      const sgsRoom = {
        ...mockRoom,
        gameType: GameType.SGS,
        roleConfig: { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 },
        maxPlayers: 5,
      };
      const updatedSgs = {
        ...sgsRoom,
        maxPlayers: 2,
        roleConfig: { monarch: 1, loyalist: 0, rebel: 1, traitor: 0 },
      };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(sgsRoom)
        .mockResolvedValueOnce(sgsRoom)
        .mockResolvedValueOnce(updatedSgs);
      mockPrisma.roomPlayer.count.mockResolvedValue(1);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 2,
      });

      expect(result).toHaveProperty('maxPlayers', 2);
      expect(mockPrisma.room.updateMany).toHaveBeenCalled();
    });

    it('rejects invalid roleConfig', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        roleConfig: { loyalServants: 99 } as PartialRoleConfig,
      });

      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('角色配置格式无效');
    });

    it('rejects when game already started', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...mockRoom, status: 'PLAYING' });

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 10,
      });

      expect(result).toEqual({ error: '游戏已开始，无法修改设置' });
    });

    it('returns error when room not found', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 10,
      });

      expect(result).toEqual({ error: '房间不存在' });
    });

    it('with only maxPlayers works', async () => {
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(mockRoom)     // getRoom check
        .mockResolvedValueOnce(mockRoom)     // getRoom inside getPlayerCount
        .mockResolvedValueOnce({ ...mockRoom, maxPlayers: 7 }); // getRoom return refreshed
      mockPrisma.roomPlayer.count.mockResolvedValue(3);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 7,
      });

      expect(result).toHaveProperty('maxPlayers', 7);
      expect(mockPrisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: expect.objectContaining({ maxPlayers: 7 }),
      });
    });

    it('with only roleConfig works', async () => {
      const newConfig = { merlin: true, percival: true, mordred: true, loyalServants: 3, minions: 2 };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce({ ...mockRoom, roleConfig: newConfig });

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        roleConfig: newConfig as PartialRoleConfig,
      });

      expect(result).toHaveProperty('roleConfig');
      expect(mockPrisma.room.updateMany).toHaveBeenCalled();
    });

    it('with no changes returns current room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {});

      expect(result).toHaveProperty('id', 'room-1');
      expect(result).toHaveProperty('code', 'ABCDEF');
      expect(mockPrisma.room.updateMany).not.toHaveBeenCalled();
    });

    it('accepts valid SGS roleConfig for SGS room', async () => {
      const sgsRoom = {
        ...mockRoom,
        gameType: GameType.SGS,
        roleConfig: { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 },
        maxPlayers: 5,
      };
      const newSgsConfig = { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(sgsRoom)
        .mockResolvedValueOnce({ ...sgsRoom, roleConfig: newSgsConfig });

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        roleConfig: newSgsConfig,
      });

      expect('error' in result).toBe(false);
      expect(mockPrisma.room.updateMany).toHaveBeenCalled();
    });
  });

  describe('leaveRoom', () => {
    const mockRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'WAITING',
      roleConfig: { merlin: true, percival: false, mordred: false, morgana: false, oberon: false, assassin: true, loyalServants: 2, minions: 1 },
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('deletes the room player and clears the offline marker', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);

      await service.leaveRoom('ABCDEF', 'user-1');

      expect(mockPrisma.roomPlayer.deleteMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1', userId: 'user-1' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('room:ABCDEF:offline:user-1');
      expect(mockRedis.hsetWithExpire).not.toHaveBeenCalledWith('room:ABCDEF', 'playerCount', expect.anything(), expect.anything());
    });

    it('transfers host to an online member when the host leaves', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { id: 'p-2', roomId: 'room-1', userId: 'u-offline', seatNo: 2 },
        { id: 'p-3', roomId: 'room-1', userId: 'u-online', seatNo: 3 },
      ]);
      // u-offline has an offline marker; u-online does not
      mockRedis.get.mockImplementation(async (key: string) =>
        key.endsWith(':u-offline') ? '1' : null,
      );

      await service.leaveRoom('ABCDEF', 'host-1');

      expect(mockPrisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: { hostId: 'u-online', updatedAt: expect.any(Date) },
      });
    });

    it('marks the host offline instead of deleting when the room started mid-leave', async () => {
      // Arrange: getRoom() saw WAITING, but a concurrent startGame committed
      // WAITING→PLAYING (roles persisted) before we took the row lock, so the
      // status-guarded update inside the transaction matches nothing.
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      // Once only: mockResolvedValue would leak into later tests, since the
      // suite uses clearAllMocks (calls) and not resetAllMocks (implementations).
      mockPrisma.room.updateMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { id: 'p-2', roomId: 'room-1', userId: 'u-2', seatNo: 2 },
      ]);

      // Act
      await service.leaveRoom('ABCDEF', 'host-1');

      // Assert: the host's row (and its persisted role) survives, and the
      // player is only marked offline — same as the PLAYING path.
      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.room.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ hostId: expect.anything() }) }),
      );
      expect(mockPrisma.room.delete).not.toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith('room:ABCDEF:offline:host-1', expect.any(String));
    });
  });

  describe('endGame', () => {
    const mockPlayingRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'PLAYING' as const,
      gameType: GameType.AVALON,
      roleConfig: { merlin: true, percival: false, mordred: false, morgana: false, oberon: false, assassin: true, loyalServants: 2, minions: 1 },
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('host ends PLAYING room → clears roles and sets WAITING', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockPlayingRoom);
      mockPrisma.roomPlayer.updateMany.mockResolvedValue({ count: 5 });
      mockPrisma.room.update.mockResolvedValue({ ...mockPlayingRoom, status: 'WAITING' });

      const result = await service.endGame('ABCDEF', 'host-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.roomPlayer.updateMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
        data: { role: null },
      });
      expect(mockPrisma.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'PLAYING' },
        data: { status: 'WAITING' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('avalon:ABCDEF:state');
      expect(mockRedis.hsetWithExpire).not.toHaveBeenCalledWith('room:ABCDEF', 'status', expect.anything(), expect.anything());
    });

    it('non-existent room → returns error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      expect(await service.endGame('ABCDEF', 'host-1')).toEqual({ error: '房间不存在' });
    });

    it('non-host → returns error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockPlayingRoom);
      expect(await service.endGame('ABCDEF', 'other-user')).toEqual({ error: '仅房主可以结束游戏' });
    });

    it('room not PLAYING → returns error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...mockPlayingRoom, status: 'WAITING' });
      expect(await service.endGame('ABCDEF', 'host-1')).toEqual({ error: '游戏尚未开始' });
    });
  });

  describe('startGame', () => {
    const sgsRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'WAITING' as const,
      gameType: GameType.SGS,
      roleConfig: { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 },
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    function buildPlayers(count: number) {
      return Array.from({ length: count }, (_, i) => ({
        id: `p-${i + 1}`,
        roomId: 'room-1',
        userId: `u-${i + 1}`,
        seatNo: i + 1,
        role: null,
        joinedAt: new Date(),
        user: { id: `u-${i + 1}`, nickName: `n${i + 1}`, avatarUrl: '' },
      }));
    }

    it('SGS room with fewer players than role total → returns clean error, not a throw', async () => {
      // Role config sums to 5 but only 3 players joined (totalRoles > players).
      mockPrisma.room.findUnique.mockResolvedValue(sgsRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayers(3));

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '角色总数(5)与玩家数(3)不匹配' });
    });

    it('SGS room with more players than role total → returns clean error', async () => {
      // Role config sums to 2 but 3 players joined (totalRoles < players).
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        roleConfig: { monarch: 1, loyalist: 0, rebel: 1, traitor: 0 },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayers(3));

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '角色总数(2)与玩家数(3)不匹配' });
    });

    it('with isRandomSeat=true shuffles player seat numbers', async () => {
      const roomWithRandomSeat = {
        ...sgsRoom,
        isRandomSeat: true,
        roleConfig: { monarch: 1, loyalist: 1, rebel: 1, traitor: 0, spy: 0 },
      };
      const players = buildPlayers(3);

      mockPrisma.room.findUnique.mockResolvedValue(roomWithRandomSeat);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(players);
      mockPrisma.roomPlayer.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.gameRecord.create.mockResolvedValue({ id: 'game-1' });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toHaveProperty('assignments');
      if ('assignments' in result) {
        const seatNos = result.assignments.map((a) => a.seatNo).sort((a, b) => a - b);
        expect(seatNos).toEqual([1, 2, 3]);
        expect(mockPrisma.roomPlayer.updateMany).toHaveBeenCalled();
      }
    });

    it('with isRandomSeat=false does not shuffle seats', async () => {
      const roomWithoutRandomSeat = {
        ...sgsRoom,
        isRandomSeat: false,
        roleConfig: { monarch: 1, loyalist: 1, rebel: 1, traitor: 0, spy: 0 },
      };
      const players = buildPlayers(3);

      mockPrisma.room.findUnique.mockResolvedValue(roomWithoutRandomSeat);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(players);
      mockPrisma.gameRecord.create.mockResolvedValue({ id: 'game-1' });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toHaveProperty('assignments');
      if ('assignments' in result) {
        const seatNos = result.assignments.map((a) => a.seatNo);
        expect(seatNos).toEqual([1, 2, 3]);
        const seatShuffleCalls = mockPrisma.roomPlayer.updateMany.mock.calls.filter(
          (call: any) => call[0]?.data?.seatNo < 0,
        );
        expect(seatShuffleCalls).toHaveLength(0);
      }
    });

    it('flips status with an atomic WAITING guard, then reads players inside the transaction', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(sgsRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayers(5));
      mockPrisma.gameRecord.create.mockResolvedValue({ id: 'game-1' });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toHaveProperty('assignments');
      expect(mockPrisma.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'WAITING', hostId: 'host-1' },
        data: { status: 'PLAYING' },
      });
      // The player list must be read AFTER the status flip so concurrent
      // join/leave cannot produce role-less players or lost assignments.
      const flipOrder = mockPrisma.room.updateMany.mock.invocationCallOrder[0];
      const readOrder = mockPrisma.roomPlayer.findMany.mock.invocationCallOrder[0];
      expect(flipOrder).toBeLessThan(readOrder);
    });

    it('concurrent start (flip affected 0 rows) → clean error, nothing persisted', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(sgsRoom);
      mockPrisma.room.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '游戏已开始' });
      expect(mockPrisma.roomPlayer.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.roomPlayer.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.gameRecord.create).not.toHaveBeenCalled();
    });

    it('rolls back PLAYING when Avalon Redis init fails', async () => {
      const avalonRoom = {
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: {
          merlin: true,
          percival: false,
          mordred: false,
          morgana: false,
          oberon: false,
          assassin: true,
          loyalServants: 2,
          minions: 1,
        },
      };
      const playingRoom = { ...avalonRoom, status: 'PLAYING' as const };
      const players = buildPlayers(5);

      mockPrisma.room.findUnique
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValueOnce(playingRoom)
        .mockResolvedValueOnce(playingRoom)
        .mockResolvedValueOnce(playingRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(players);
      mockPrisma.gameRecord.create.mockResolvedValue({ id: 'game-1' });
      mockPrisma.gameRecord.updateMany.mockResolvedValue({ count: 1 });

      service.setAvalonGameInitializer({
        initializeGame: jest.fn().mockRejectedValue(new Error('redis down')),
      });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: 'Avalon 游戏状态初始化失败' });
      expect(mockPrisma.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'PLAYING' },
        data: { status: 'WAITING' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('avalon:ABCDEF:state');
    });

    it('performs full generation-guarded DB cleanup when the reset Redis lock fails', async () => {
      const avalonRoom = {
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: {
          merlin: true, percival: false, mordred: false, morgana: false,
          oberon: false, assassin: true, loyalServants: 2, minions: 1,
        },
      };
      const playingRoom = { ...avalonRoom, status: 'PLAYING' as const };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValue(playingRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayers(5));
      service.setAvalonGameInitializer({
        initializeGame: jest.fn().mockRejectedValue(new Error('redis down')),
      });
      mockRedis.withLock.mockImplementation(async (key: string, _ttl: number, fn: (lease: unknown) => Promise<unknown>) => {
        if (key.startsWith('lock:avalon:')) throw new Error('LOCK_BUSY');
        return fn({ key, token: 'test-token' });
      });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: 'Avalon 游戏状态初始化失败' });
      expect(mockPrisma.gameRecord.updateMany).toHaveBeenCalledWith({
        where: { id: 'game-1', roomId: 'room-1', endedAt: null },
        data: { endedAt: expect.any(Date) },
      });
      expect(mockPrisma.roomPlayer.updateMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
        data: { role: null },
      });
      expect(mockPrisma.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'PLAYING' },
        data: { status: 'WAITING' },
      });
    });

    it('rejects an Avalon config whose loyal/minion split is not what the engine deals', async () => {
      // Arrange: 8 players, merlin + assassin + 6 loyal servants + 0 minions.
      // The counts add up to 8, but the engine fills factions from
      // FACTION_COUNTS (5 good / 3 evil), so this config would silently deal a
      // different game than the host configured.
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        gameType: GameType.AVALON,
        maxPlayers: 8,
        roleConfig: {
          merlin: true,
          percival: false,
          mordred: false,
          morgana: false,
          oberon: false,
          assassin: true,
          loyalServants: 6,
          minions: 0,
        },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayers(8));

      // Act
      const result = await service.startGame('ABCDEF', 'host-1');

      // Assert
      expect(result).toEqual({
        error: '角色配置与 8 人局不匹配：忠臣应为 4 人、爪牙应为 2 人',
      });
      expect(mockPrisma.gameRecord.create).not.toHaveBeenCalled();
    });

    it('initializes Avalon state with the config read inside the transaction', async () => {
      // Arrange: the pre-transaction snapshot still has the old 4-special-role
      // config; updateRoomSettings committed a merlin+assassin config before the
      // status flip took the room row lock.
      const staleRoom = {
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: {
          merlin: true, percival: true, mordred: false, morgana: true,
          oberon: false, assassin: true, loyalServants: 1, minions: 0,
        },
      };
      const freshRoom = {
        ...staleRoom,
        roleConfig: {
          merlin: true, percival: false, mordred: false, morgana: false,
          oberon: false, assassin: true, loyalServants: 2, minions: 1,
        },
      };
      const players = buildPlayers(5);
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(staleRoom)   // getRoom() before the transaction
        .mockResolvedValue(freshRoom);      // inside the transaction and after
      mockPrisma.roomPlayer.findMany.mockResolvedValue(players);
      mockPrisma.gameRecord.create.mockResolvedValue({ id: 'game-1' });
      const initializeGame = jest.fn().mockResolvedValue(undefined);
      service.setAvalonGameInitializer({ initializeGame });

      // Act
      const result = await service.startGame('ABCDEF', 'host-1');

      // Assert: the game state advertises exactly the roles that were dealt.
      expect(result).toHaveProperty('assignments');
      const config = initializeGame.mock.calls[0][2];
      expect(config.roles).toEqual(['Merlin', 'Assassin']);
      if ('assignments' in result) {
        const dealtSpecials = result.assignments
          .map((a) => a.role)
          .filter((role) => role !== 'LoyalServant' && role !== 'Minion')
          .sort();
        expect(dealtSpecials).toEqual(['Assassin', 'Merlin']);
      }
    });
  });

  describe('joinRoom status guards', () => {
    const mockWaitingRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'WAITING' as const,
      gameType: GameType.AVALON,
      roleConfig: { merlin: true, percival: false, mordred: false, morgana: false, oberon: false, assassin: true, loyalServants: 2, minions: 1 },
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('rejects join when PLAYING', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...mockWaitingRoom, status: 'PLAYING' });
      const result = await service.joinRoom('ABCDEF', 'u-new');
      expect(result).toEqual({ error: '游戏已开始，无法加入' });
    });

  });

  describe('kickPlayer', () => {
    const mockRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'WAITING' as const,
      gameType: GameType.AVALON,
      roleConfig: { merlin: true, percival: false, mordred: false, morgana: false, oberon: false, assassin: true, loyalServants: 2, minions: 1 },
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('rejects kick when PLAYING', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...mockRoom, status: 'PLAYING' });
      const result = await service.kickPlayer('ABCDEF', 'host-1', 'u2');
      expect(result).toEqual({ error: '游戏进行中，无法踢人' });
      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
    });

    it('returns an error when the target is not in the room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.kickPlayer('ABCDEF', 'host-1', 'ghost-user');

      expect(result).toEqual({ error: '该玩家不在房间中' });
    });

    it('does not delete when the room starts between the snapshot and transaction', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.room.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.kickPlayer('ABCDEF', 'host-1', 'u2');

      expect(result).toEqual({ error: '游戏已开始或房主已变更' });
      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('joinRoom transaction safety', () => {
    const waitingRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'WAITING' as const,
      gameType: GameType.AVALON,
      roleConfig: { merlin: true, percival: false, mordred: false, morgana: false, oberon: false, assassin: true, loyalServants: 2, minions: 1 },
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    function buildTx(playerCount: number, maxPlayers = waitingRoom.maxPlayers) {
      return {
        room: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          // Capacity is read inside the transaction, so the tx client must
          // answer it — the pre-transaction snapshot may be stale.
          findUnique: jest.fn().mockResolvedValue({ maxPlayers }),
        },
        roomPlayer: {
          count: jest.fn().mockResolvedValue(playerCount),
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([{ seatNo: 1 }]),
          create: jest.fn().mockImplementation(async ({ data }: any) => ({
            id: `p-${data.userId}`,
            roomId: data.roomId,
            userId: data.userId,
            seatNo: data.seatNo,
            joinedAt: new Date(),
          })),
        },
      };
    }

    it('assigns the seat through the transaction client, not the root prisma', async () => {
      const tx = buildTx(1);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);
      mockPrisma.roomPlayer.count.mockResolvedValue(2);
      mockPrisma.roomPlayer.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-new', nickName: 'n', avatarUrl: '' });

      const result = await service.joinRoom('ABCDEF', 'u-new');

      expect(result).toHaveProperty('player');
      // Room row is locked first via a status-guarded update
      expect(tx.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'WAITING' },
        data: { updatedAt: expect.any(Date) },
      });
      expect(tx.roomPlayer.create).toHaveBeenCalledWith({
        data: { roomId: 'room-1', userId: 'u-new', seatNo: 2 },
      });
      expect(mockPrisma.roomPlayer.create).not.toHaveBeenCalled();
    });

    it('rejects when the room is full (capacity enforced inside the transaction)', async () => {
      const tx = buildTx(5);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);

      const result = await service.joinRoom('ABCDEF', 'u-new');

      expect(result).toEqual({ error: '房间已满' });
      expect(tx.roomPlayer.create).not.toHaveBeenCalled();
    });

    it('rejects when maxPlayers was lowered after the pre-transaction room read', async () => {
      // Arrange: getRoom() sees maxPlayers 5, but updateRoomSettings committed
      // a lower limit before we took the room row lock.
      const tx = buildTx(3, 3);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.joinRoom('ABCDEF', 'u-new');

      // Assert: the fresh limit wins, so the room is not overfilled.
      expect(result).toEqual({ error: '房间已满' });
      expect(tx.roomPlayer.create).not.toHaveBeenCalled();
    });

    it('two concurrent joins cannot both pass the capacity check', async () => {
      // Simulates the room row lock: transactions are serialized and each one
      // observes the other one's committed player rows.
      let committedPlayers = 4; // maxPlayers 5 → exactly one seat left
      let lock: Promise<void> = Promise.resolve();
      const acquireLock = () => {
        const prev = lock;
        let release!: () => void;
        lock = new Promise<void>((r) => (release = r));
        return prev.then(() => release);
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const release = await acquireLock();
        const tx = {
          room: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({ maxPlayers: 5 }),
          },
          roomPlayer: {
            count: jest.fn().mockImplementation(async () => committedPlayers),
            findFirst: jest.fn().mockResolvedValue(null),
            findMany: jest.fn().mockImplementation(async () =>
              Array.from({ length: committedPlayers }, (_, i) => ({ seatNo: i + 1 })),
            ),
            create: jest.fn().mockImplementation(async ({ data }: any) => {
              committedPlayers++;
              return { id: `p-${data.userId}`, roomId: data.roomId, userId: data.userId, seatNo: data.seatNo, joinedAt: new Date() };
            }),
          },
        };
        try {
          return await cb(tx);
        } finally {
          release();
        }
      });
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);
      mockPrisma.roomPlayer.count.mockImplementation(async () => committedPlayers);
      mockPrisma.roomPlayer.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockImplementation(async ({ where }: any) => ({
        id: where.id,
        nickName: 'n',
        avatarUrl: '',
      }));

      const [r1, r2] = await Promise.all([
        service.joinRoom('ABCDEF', 'u-a'),
        service.joinRoom('ABCDEF', 'u-b'),
      ]);

      const successes = [r1, r2].filter((r) => !('error' in r));
      const errors = [r1, r2].filter((r) => 'error' in r);
      expect(successes).toHaveLength(1);
      expect(errors).toEqual([{ error: '房间已满' }]);
    });
  });

  describe('markPlayerOffline', () => {
    const waitingRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'WAITING' as const,
      gameType: GameType.AVALON,
      roleConfig: {},
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('stores the offline marker WITHOUT a TTL', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);

      await service.markPlayerOffline('ABCDEF', 'u-1');

      expect(mockRedis.set).toHaveBeenCalledWith('room:ABCDEF:offline:u-1', expect.any(String));
      expect(mockRedis.set.mock.calls[0]).toHaveLength(2);
    });

    it('transfers host to an online member when the host goes offline mid-game', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...waitingRoom, status: 'PLAYING' as const });
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { id: 'p-1', roomId: 'room-1', userId: 'host-1', seatNo: 1, role: '梅林', joinedAt: new Date(), user: { id: 'host-1', nickName: 'h', avatarUrl: '' } },
        { id: 'p-2', roomId: 'room-1', userId: 'u-2', seatNo: 2, role: '忠臣', joinedAt: new Date(), user: { id: 'u-2', nickName: 'a', avatarUrl: '' } },
        { id: 'p-3', roomId: 'room-1', userId: 'u-3', seatNo: 3, role: '忠臣', joinedAt: new Date(), user: { id: 'u-3', nickName: 'b', avatarUrl: '' } },
      ]);
      // u-2 is also offline → the online u-3 must become host
      mockRedis.get.mockImplementation(async (key: string) =>
        key.endsWith(':u-2') ? '1' : null,
      );
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({
        id: 'p-3', roomId: 'room-1', userId: 'u-3', seatNo: 3,
      });
      const updateHost = jest.fn().mockResolvedValue(undefined);
      service.setAvalonGameInitializer({ initializeGame: jest.fn(), updateHost });

      await service.markPlayerOffline('ABCDEF', 'host-1');

      expect(mockPrisma.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'PLAYING', hostId: 'host-1' },
        data: { hostId: 'u-3' },
      });
      expect(updateHost).toHaveBeenCalledWith('ABCDEF', 'u-3');
    });

    it('does not transfer host in a WAITING room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);

      await service.markPlayerOffline('ABCDEF', 'host-1');

      const hostUpdates = mockPrisma.room.update.mock.calls.filter(
        (call: any) => call[0]?.data?.hostId,
      );
      expect(hostUpdates).toHaveLength(0);
    });
  });

  describe('cleanupOfflinePlayers', () => {
    it('broadcasts via the registered notifier after removing offline players', async () => {
      const waitingRoom = {
        id: 'room-1',
        code: 'ABCDEF',
        hostId: 'host-1',
        status: 'WAITING' as const,
        gameType: GameType.AVALON,
        roleConfig: {},
        maxPlayers: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.room.findMany.mockResolvedValue([{ code: 'ABCDEF' }]);
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { id: 'p-1', roomId: 'room-1', userId: 'u-1', seatNo: 1, role: null, joinedAt: new Date(), user: { id: 'u-1', nickName: 'a', avatarUrl: '' } },
      ]);
      mockRedis.get.mockResolvedValue('1'); // everyone offline long past the grace period
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null); // removed after leaveRoom
      const notifier = { notifyClientsAfterLeave: jest.fn().mockResolvedValue(undefined) };
      service.setEventsNotifier(notifier);

      await service.cleanupOfflinePlayers();

      expect(notifier.notifyClientsAfterLeave).toHaveBeenCalledWith('ABCDEF', 'u-1');
    });

    it('keeps recently disconnected players for the full grace period', async () => {
      mockPrisma.room.findMany.mockResolvedValue([{ code: 'ABCDEF' }]);
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room-1', code: 'ABCDEF', hostId: 'host-1', status: 'WAITING',
        gameType: GameType.AVALON, roleConfig: {}, maxPlayers: 5,
        createdAt: new Date(), updatedAt: new Date(),
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { id: 'p-1', roomId: 'room-1', userId: 'u-1', seatNo: 1, role: null, joinedAt: new Date(), user: { id: 'u-1', nickName: 'a', avatarUrl: '' } },
      ]);
      mockRedis.get.mockResolvedValue(Date.now().toString());
      const notifier = { notifyClientsAfterLeave: jest.fn() };
      service.setEventsNotifier(notifier as never);

      await service.cleanupOfflinePlayers();

      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
      expect(notifier.notifyClientsAfterLeave).not.toHaveBeenCalled();
    });
  });
});
