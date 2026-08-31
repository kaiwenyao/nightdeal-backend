import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from './room.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PartialRoleConfig } from './role-config.schema';
import { GameType } from '../../prisma/generated/prisma/client.js';

describe('RoomService', () => {
  let service: RoomService;

  const offlineMarker = (
    playerId: string,
    presenceVersion = 0,
    disconnectedAt = 1,
  ) => JSON.stringify({ playerId, presenceVersion, disconnectedAt });

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
    $queryRaw: jest.fn(),
  };

  const mockRedis = {
    hset: jest.fn().mockResolvedValue(undefined),
    hsetWithExpire: jest.fn().mockResolvedValue(undefined),
    hget: jest.fn().mockResolvedValue(null),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    setWithLock: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delWithLock: jest.fn().mockResolvedValue(undefined),
    delJsonFieldWithLock: jest.fn().mockResolvedValue(true),
    expire: jest.fn().mockResolvedValue(undefined),
    withLock: jest.fn().mockImplementation(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockReset().mockImplementation(async (cb: any) => cb(mockPrisma));
    mockPrisma.$queryRaw.mockReset().mockResolvedValue([{ id: 'room-1' }]);
    mockPrisma.room.updateMany.mockReset().mockResolvedValue({ count: 1 });
    mockPrisma.room.deleteMany.mockReset().mockResolvedValue({ count: 1 });
    mockPrisma.gameRecord.create.mockReset().mockResolvedValue({ id: 'game-1' });
    mockPrisma.gameRecord.findFirst.mockReset().mockResolvedValue({ id: 'game-1' });
    mockPrisma.gameRecord.updateMany.mockReset().mockResolvedValue({ count: 1 });
    mockPrisma.roomPlayer.deleteMany.mockReset().mockResolvedValue({ count: 1 });
    mockPrisma.roomPlayer.updateMany.mockReset().mockResolvedValue({ count: 1 });
    mockPrisma.roomPlayer.findFirst.mockReset().mockResolvedValue(null);
    mockRedis.get.mockReset().mockResolvedValue(null);
    mockRedis.hget.mockReset().mockResolvedValue(null);
    mockRedis.del.mockReset().mockResolvedValue(undefined);
    mockRedis.setWithLock.mockReset().mockResolvedValue(undefined);
    mockRedis.delWithLock.mockReset().mockResolvedValue(undefined);
    mockRedis.delJsonFieldWithLock.mockReset().mockResolvedValue(true);
    mockRedis.withLock.mockReset().mockImplementation(async (key: string, _ttl: number, fn: (lease: unknown) => Promise<unknown>) => fn({ key, token: 'test-token' }));

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
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'player-1', presenceVersion: 0 });

      await service.leaveRoom('ABCDEF', 'user-1');

      expect(mockPrisma.roomPlayer.deleteMany).toHaveBeenCalledWith({
        where: { id: 'player-1', roomId: 'room-1', userId: 'user-1', presenceVersion: 0 },
      });
      expect(mockRedis.delWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:room:ABCDEF:presence' }),
        'room:ABCDEF:offline:user-1',
      );
      expect(mockRedis.hsetWithExpire).not.toHaveBeenCalledWith('room:ABCDEF', 'playerCount', expect.anything(), expect.anything());
    });

    it('ignores an old marker after leave cleanup fails and membership is recreated', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findFirst
        .mockResolvedValueOnce({ id: 'old-player', presenceVersion: 0 });
      mockRedis.delWithLock.mockRejectedValueOnce(new Error('LOCK_LOST'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(service.leaveRoom('ABCDEF', 'user-1')).resolves.toBe('removed');

      mockRedis.get.mockResolvedValue(offlineMarker('old-player'));
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'new-player', presenceVersion: 0 });
      await expect(service.isPlayerOffline('ABCDEF', 'user-1')).resolves.toBe(false);
      await expect(service.cleanupOfflinePlayer('ABCDEF', 'user-1')).resolves.toBe('skipped');
      loggerSpy.mockRestore();
    });

    it('transfers host to an online member when the host leaves', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findFirst.mockImplementation(async ({ where }: any) => {
        const ids: Record<string, string> = {
          'host-1': 'p-host',
          'u-offline': 'p-2',
          'u-online': 'p-3',
        };
        return { id: ids[where.userId] ?? 'p-3', presenceVersion: 0 };
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { id: 'p-2', roomId: 'room-1', userId: 'u-offline', seatNo: 2 },
        { id: 'p-3', roomId: 'room-1', userId: 'u-online', seatNo: 3 },
      ]);
      // u-offline has an offline marker; u-online does not
      mockRedis.get.mockImplementation(async (key: string) =>
        key.endsWith(':u-offline') ? offlineMarker('p-2') : null,
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
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-host', presenceVersion: 1 });
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
      expect(mockRedis.setWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:room:ABCDEF:presence' }),
        'room:ABCDEF:offline:host-1',
        expect.any(String),
      );
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
      expect(mockRedis.delJsonFieldWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:avalon:ABCDEF:state' }),
        'avalon:ABCDEF:state',
        'generationId',
        'game-1',
      );
      expect(mockRedis.hsetWithExpire).not.toHaveBeenCalledWith('room:ABCDEF', 'status', expect.anything(), expect.anything());
    });

    it('returns success when post-commit Avalon cleanup lock is unavailable', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockPlayingRoom);
      mockRedis.withLock.mockImplementation(async (key: string, _ttl: number, fn: (lease: unknown) => Promise<unknown>) => {
        if (key.startsWith('lock:avalon:')) throw new Error('LOCK_BUSY');
        return fn({ key, token: 'test-token' });
      });
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      const result = await service.endGame('ABCDEF', 'host-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.roomPlayer.updateMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
        data: { role: null },
      });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('post-commit Avalon cleanup'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });

    it('does not reset a successor game when the captured generation is already ended', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockPlayingRoom);
      mockPrisma.gameRecord.findFirst.mockResolvedValue({ id: 'game-old' });
      mockPrisma.gameRecord.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.endGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '游戏状态已变更，请刷新后重试' });
      expect(mockPrisma.gameRecord.updateMany).toHaveBeenCalledWith({
        where: { id: 'game-old', roomId: 'room-1', endedAt: null },
        data: { endedAt: expect.any(Date) },
      });
      expect(mockPrisma.roomPlayer.updateMany).not.toHaveBeenCalled();
      expect(mockRedis.delJsonFieldWithLock).not.toHaveBeenCalled();
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
      expect(mockRedis.delJsonFieldWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:avalon:ABCDEF:state' }),
        'avalon:ABCDEF:state',
        'generationId',
        'game-1',
      );
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

    it('does not delete Redis state when failed-start fallback no longer owns that generation', async () => {
      const avalonRoom = {
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: {
          merlin: true, percival: false, mordred: false, morgana: false,
          oberon: false, assassin: true, loyalServants: 2, minions: 1,
        },
      };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValue({ ...avalonRoom, status: 'PLAYING' });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayers(5));
      mockPrisma.gameRecord.updateMany
        .mockResolvedValueOnce({ count: 0 }) // start's legacy-record cleanup
        .mockResolvedValueOnce({ count: 0 }); // stale generation CAS
      service.setAvalonGameInitializer({
        initializeGame: jest.fn().mockRejectedValue(new Error('redis down')),
      });
      mockRedis.withLock.mockImplementation(async (key: string, _ttl: number, fn: (lease: unknown) => Promise<unknown>) => {
        if (key.startsWith('lock:avalon:')) throw new Error('LOCK_BUSY');
        return fn({ key, token: 'test-token' });
      });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: 'Avalon 游戏状态初始化失败' });
      expect(mockRedis.delJsonFieldWithLock).not.toHaveBeenCalled();
      expect(mockRedis.del).not.toHaveBeenCalledWith('avalon:ABCDEF:state');
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

    it('does not initialize Redis when the committed game generation is no longer active', async () => {
      const avalonRoom = {
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: {
          merlin: true, percival: false, mordred: false, morgana: false,
          oberon: false, assassin: true, loyalServants: 2, minions: 1,
        },
      };
      mockPrisma.room.findUnique.mockResolvedValue({ ...avalonRoom, status: 'PLAYING' });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayers(5));
      mockPrisma.gameRecord.findFirst.mockResolvedValue(null);
      const initializeGame = jest.fn();
      service.setAvalonGameInitializer({ initializeGame });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: 'Avalon 游戏状态初始化失败' });
      expect(initializeGame).not.toHaveBeenCalled();
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
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-u-1', presenceVersion: 1 });

      await service.markPlayerOffline('ABCDEF', 'u-1');

      expect(mockRedis.setWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:room:ABCDEF:presence' }),
        'room:ABCDEF:offline:u-1',
        expect.any(String),
      );
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
        key.endsWith(':u-2') ? offlineMarker('p-2') : null,
      );
      mockPrisma.roomPlayer.findFirst.mockImplementation(async ({ where }: any) => {
        const player = {
          'host-1': { id: 'p-1', presenceVersion: 1 },
          'u-2': { id: 'p-2', presenceVersion: 0 },
          'u-3': { id: 'p-3', presenceVersion: 0 },
        } as Record<string, { id: string; presenceVersion: number }>;
        return player[where.userId] ?? player['u-3'];
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

    it('serializes simultaneous disconnects and leaves an online player as host', async () => {
      let currentHost = 'host-1';
      const offline = new Map<string, string>();
      let queue = Promise.resolve<unknown>(undefined);
      mockRedis.withLock.mockImplementation((key: string, _ttl: number, fn: (lease: unknown) => Promise<unknown>) => {
        const run = queue.then(() => fn({ key, token: 'test-token' }));
        queue = run.catch(() => undefined);
        return run;
      });
      mockRedis.setWithLock.mockImplementation(async (_lease: unknown, key: string, value: string) => {
        offline.set(key.split(':').pop()!, value);
      });
      mockRedis.get.mockImplementation(async (key: string) =>
        offline.get(key.split(':').pop()!) ?? null,
      );
      mockPrisma.room.findUnique.mockImplementation(async () => ({
        ...waitingRoom,
        status: 'PLAYING' as const,
        hostId: currentHost,
      }));
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { id: 'p-1', roomId: 'room-1', userId: 'host-1', seatNo: 1, role: 'Merlin', joinedAt: new Date(), user: { id: 'host-1', nickName: 'h', avatarUrl: '' } },
        { id: 'p-2', roomId: 'room-1', userId: 'u-2', seatNo: 2, role: 'LoyalServant', joinedAt: new Date(), user: { id: 'u-2', nickName: 'a', avatarUrl: '' } },
        { id: 'p-3', roomId: 'room-1', userId: 'u-3', seatNo: 3, role: 'LoyalServant', joinedAt: new Date(), user: { id: 'u-3', nickName: 'b', avatarUrl: '' } },
      ]);
      mockPrisma.roomPlayer.findFirst.mockImplementation(async ({ where }: any) => ({
        id: where.userId === 'host-1' ? 'p-1' : where.userId === 'u-2' ? 'p-2' : 'p-3',
        roomId: 'room-1',
        userId: where.userId,
        presenceVersion: where.userId === 'host-1' || where.userId === 'u-2' ? 1 : 0,
        seatNo: where.userId === 'u-2' ? 2 : 3,
      }));
      mockPrisma.room.updateMany.mockImplementation(async ({ where, data }: any) => {
        if (where.hostId !== currentHost) return { count: 0 };
        currentHost = data.hostId;
        return { count: 1 };
      });
      service.setAvalonGameInitializer({ initializeGame: jest.fn(), updateHost: jest.fn() });

      await Promise.all([
        service.markPlayerOffline('ABCDEF', 'host-1'),
        service.markPlayerOffline('ABCDEF', 'u-2'),
      ]);

      expect(currentHost).toBe('u-3');
      expect(mockRedis.withLock.mock.calls.map((call) => call[0])).toEqual([
        'lock:room:ABCDEF:presence',
        'lock:room:ABCDEF:presence',
      ]);
    });

    it('does not transfer host in a WAITING room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-1', presenceVersion: 1 });

      await service.markPlayerOffline('ABCDEF', 'host-1');

      const hostUpdates = mockPrisma.room.update.mock.calls.filter(
        (call: any) => call[0]?.data?.hostId,
      );
      expect(hostUpdates).toHaveLength(0);
    });
  });

  describe('cleanupIdleRooms', () => {
    const staleRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      status: 'WAITING',
    };

    it('keeps stale rooms that still have online players', async () => {
      const updatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
      mockPrisma.room.findMany.mockResolvedValue([staleRoom]);
      mockPrisma.room.findUnique.mockResolvedValue({ updatedAt });
      mockPrisma.roomPlayer.findMany.mockResolvedValue([{ userId: 'u-1' }]);
      mockRedis.get.mockResolvedValue(null); // no offline marker = online
      mockRedis.hget.mockResolvedValue(null);

      await service.cleanupIdleRooms();

      expect(mockPrisma.room.deleteMany).not.toHaveBeenCalled();
    });

    it('commits DB deletion before best-effort Redis cleanup', async () => {
      const updatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
      mockPrisma.room.findMany.mockResolvedValue([staleRoom]);
      mockPrisma.room.findUnique.mockResolvedValue({ updatedAt });
      mockPrisma.roomPlayer.findMany.mockResolvedValue([{ userId: 'u-1' }]);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-1', presenceVersion: 0 });
      mockPrisma.room.deleteMany.mockResolvedValue({ count: 1 });
      mockRedis.get.mockImplementation(async (key: string) =>
        key.startsWith('avalon:')
          ? JSON.stringify({ generationId: 'game-1' })
          : offlineMarker('p-1'),
      );
      mockRedis.hget.mockResolvedValue(null);
      mockRedis.del.mockRejectedValueOnce(new Error('redis down'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(service.cleanupIdleRooms()).resolves.toBeUndefined();

      expect(mockPrisma.room.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.room.deleteMany.mock.invocationCallOrder[0])
        .toBeLessThan(mockRedis.del.mock.invocationCallOrder[0]);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed Redis cleanup'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });
  });

  describe('cleanupOfflinePlayer presence CAS', () => {
    it('does not delete a membership whose presence version changed after cleanup began', async () => {
      const waitingRoom = {
        id: 'room-1', code: 'ABCDEF', hostId: 'host-1', status: 'WAITING' as const,
        gameType: GameType.AVALON, roleConfig: {}, maxPlayers: 5,
        createdAt: new Date(), updatedAt: new Date(),
      };
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockRedis.get.mockResolvedValue(offlineMarker('p-1', 7));
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-1', presenceVersion: 7 });
      mockPrisma.roomPlayer.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.cleanupOfflinePlayer('ABCDEF', 'u-1');

      expect(result).toBe('not_found');
      expect(mockPrisma.roomPlayer.deleteMany).toHaveBeenCalledWith({
        where: { id: 'p-1', roomId: 'room-1', userId: 'u-1', presenceVersion: 7 },
      });
      expect(mockRedis.delWithLock).not.toHaveBeenCalled();
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
      mockRedis.get.mockResolvedValue(offlineMarker('p-1'));
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-1', presenceVersion: 0 });
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
      mockRedis.get.mockResolvedValue(offlineMarker('p-1', 0, Date.now()));
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-1', presenceVersion: 0 });
      const notifier = { notifyClientsAfterLeave: jest.fn() };
      service.setEventsNotifier(notifier as never);

      await service.cleanupOfflinePlayers();

      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
      expect(notifier.notifyClientsAfterLeave).not.toHaveBeenCalled();
    });
  });

  describe('read-model helpers (getPlayer, getPlayers, counts, roles, user info)', () => {
    const baseRoom = {
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

    const basePlayer = (userId: string, overrides: Record<string, unknown> = {}) => ({
      id: `p-${userId}`,
      roomId: 'room-1',
      userId,
      seatNo: 1,
      role: null,
      joinedAt: new Date(),
      presenceVersion: 0,
      user: { id: userId, nickName: 'n', avatarUrl: '' },
      ...overrides,
    });

    it('getPlayer resolves online state from the offline marker', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(baseRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(
        basePlayer('u-1', { role: 'Merlin', seatNo: 2 }),
      );
      mockRedis.get.mockResolvedValue(offlineMarker('p-u-1', 0));

      const player = await service.getPlayer('ABCDEF', 'u-1');

      expect(player).toMatchObject({
        id: 'p-u-1',
        userId: 'u-1',
        seatNo: 2,
        role: 'Merlin',
        isOnline: false,
      });
    });

    it('getPlayers maps roles, joinedAt and offline flags for every seat', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(baseRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        basePlayer('u-1', { seatNo: 1, role: 'Merlin' }),
        basePlayer('u-2', { seatNo: 2, role: null, joinedAt: null }),
      ]);
      mockRedis.get.mockResolvedValue(null);

      const players = await service.getPlayers('ABCDEF');

      expect(players).toHaveLength(2);
      expect(players[0]).toMatchObject({ role: 'Merlin', joinedAt: expect.any(Date), isOnline: true });
      expect(players[1]).toMatchObject({ role: undefined, joinedAt: undefined, isOnline: true });
    });

    it('returns empty values for a missing room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);

      await expect(service.getPlayers('MISSING')).resolves.toEqual([]);
      await expect(service.getPlayerCount('MISSING')).resolves.toBe(0);
      await expect(service.getPlayer('MISSING', 'u-1')).resolves.toBeNull();
    });

    it('getUserRooms returns the codes of rooms the user belongs to', async () => {
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { room: { code: 'AAAAAA' } },
        { room: { code: 'BBBBBB' } },
      ]);

      await expect(service.getUserRooms('u-1')).resolves.toEqual(['AAAAAA', 'BBBBBB']);
      expect(mockPrisma.roomPlayer.findMany).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        select: { room: { select: { code: true } } },
      });
    });

    it('isActiveGameGeneration is true only while the record is open in a PLAYING room', async () => {
      mockPrisma.gameRecord.findFirst.mockResolvedValue({ id: 'game-1' });
      await expect(service.isActiveGameGeneration('ABCDEF', 'game-1')).resolves.toBe(true);
      expect(mockPrisma.gameRecord.findFirst).toHaveBeenCalledWith({
        where: { id: 'game-1', endedAt: null, room: { code: 'ABCDEF', status: 'PLAYING' } },
        select: { id: true },
      });

      mockPrisma.gameRecord.findFirst.mockResolvedValue(null);
      await expect(service.isActiveGameGeneration('ABCDEF', 'game-1')).resolves.toBe(false);
    });

    it('getPlayerRole returns the role, null for role-less or missing players', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(baseRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(basePlayer('u-1', { role: 'Merlin' }));
      await expect(service.getPlayerRole('ABCDEF', 'u-1')).resolves.toBe('Merlin');

      mockPrisma.roomPlayer.findFirst.mockResolvedValue(basePlayer('u-1', { role: null }));
      await expect(service.getPlayerRole('ABCDEF', 'u-1')).resolves.toBeNull();

      mockPrisma.room.findUnique.mockResolvedValue(null);
      await expect(service.getPlayerRole('MISSING', 'u-1')).resolves.toBeNull();
    });

    it('isPlayerOffline ignores corrupt and stale-membership markers', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(baseRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(basePlayer('u-1'));

      // unparseable JSON → legacy garbage is ignored
      mockRedis.get.mockResolvedValue('not-json{');
      await expect(service.isPlayerOffline('ABCDEF', 'u-1')).resolves.toBe(false);

      // wrong field types → marker shape invalid
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ playerId: 'p-u-1', presenceVersion: 'zero', disconnectedAt: 1 }),
      );
      await expect(service.isPlayerOffline('ABCDEF', 'u-1')).resolves.toBe(false);

      // marker bound to a since-recreated membership row
      mockRedis.get.mockResolvedValue(offlineMarker('p-old', 0));
      await expect(service.isPlayerOffline('ABCDEF', 'u-1')).resolves.toBe(false);

      // exact id + presence version match
      mockRedis.get.mockResolvedValue(offlineMarker('p-u-1', 0));
      await expect(service.isPlayerOffline('ABCDEF', 'u-1')).resolves.toBe(true);
    });

    it('updatePlayerInfo writes only the provided fields', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await service.updatePlayerInfo('u-1', { nickName: '新昵称' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { nickName: '新昵称' },
      });

      await service.updatePlayerInfo('u-1', { nickName: '新昵称', avatarUrl: 'http://a/b.png' });
      expect(mockPrisma.user.update).toHaveBeenLastCalledWith({
        where: { id: 'u-1' },
        data: { nickName: '新昵称', avatarUrl: 'http://a/b.png' },
      });
    });
  });

  describe('createRoom config validation and code generation', () => {
    const createdRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'WAITING',
      gameType: GameType.AVALON,
      roleConfig: {},
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('rejects an SGS config that fails schema validation', async () => {
      const result = await service.createRoom('host-1', { monarch: 2 } as never, 5, GameType.SGS);

      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('SGS 角色配置格式无效');
    });

    it('rejects an SGS config whose role total does not match the room size', async () => {
      const result = await service.createRoom(
        'host-1',
        { monarch: 1, loyalist: 1, rebel: 1, traitor: 1 },
        5,
        GameType.SGS,
      );

      expect(result).toEqual({ error: '角色总数(4)与房间人数(5)不匹配' });
    });

    it('rejects an Avalon config whose role total does not match the room size', async () => {
      const result = await service.createRoom(
        'host-1',
        { merlin: true, loyalServants: 2, minions: 0 } as PartialRoleConfig,
        5,
      );

      expect(result).toEqual({ error: '角色总数(3)与房间人数(5)不匹配' });
    });

    it('defaults the SGS room size to 2 when maxPlayers is omitted', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      mockPrisma.room.create.mockResolvedValue({ ...createdRoom, gameType: GameType.SGS, maxPlayers: 2 });
      mockPrisma.roomPlayer.create.mockResolvedValue({ id: 'p-1' });

      const result = await service.createRoom('host-1', undefined, undefined, GameType.SGS);

      expect(result).toMatchObject({ maxPlayers: 2, gameType: GameType.SGS });
      expect(mockPrisma.room.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          maxPlayers: 2,
          gameType: GameType.SGS,
          roleConfig: { monarch: 1, loyalist: 0, rebel: 1, traitor: 0 },
        }),
      });
    });

    it('honors an explicit isRandomSeat and defaults to false', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      mockPrisma.room.create.mockResolvedValue(createdRoom);
      mockPrisma.roomPlayer.create.mockResolvedValue({ id: 'p-1' });

      await service.createRoom('host-1', undefined, 5, GameType.AVALON, true);
      await service.createRoom('host-1', undefined, 5);

      expect(mockPrisma.room.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({ isRandomSeat: true, maxPlayers: 5, gameType: GameType.AVALON }),
      });
      expect(mockPrisma.room.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({ isRandomSeat: false }),
      });
    });

    it('throws after five consecutive room-code collisions', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.createRoom('host-1', undefined, 5)).rejects.toThrow('房间码生成失败，请重试');

      expect(mockPrisma.room.findUnique).toHaveBeenCalledTimes(5);
      expect(mockPrisma.room.create).not.toHaveBeenCalled();
    });
  });

  describe('joinRoom guard branches', () => {
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

    function buildTx(overrides: {
      locked?: { count: number };
      roomInTx?: unknown;
      playerCount?: number;
      existing?: unknown;
      occupiedSeats?: number[];
      createImpl?: jest.Mock;
    } = {}) {
      return {
        room: {
          updateMany: jest.fn().mockResolvedValue(overrides.locked ?? { count: 1 }),
          findUnique: jest.fn().mockResolvedValue(
            overrides.roomInTx === undefined ? { maxPlayers: 5 } : overrides.roomInTx,
          ),
        },
        roomPlayer: {
          count: jest.fn().mockResolvedValue(overrides.playerCount ?? 0),
          findFirst: jest.fn().mockResolvedValue(overrides.existing ?? null),
          findMany: jest.fn().mockResolvedValue(
            (overrides.occupiedSeats ?? []).map((seatNo) => ({ seatNo })),
          ),
          create: overrides.createImpl
            ?? jest.fn().mockImplementation(async ({ data }: any) => ({
              id: `p-${data.userId}`,
              roomId: data.roomId,
              userId: data.userId,
              seatNo: data.seatNo,
              joinedAt: new Date(),
            })),
        },
      };
    }

    it('returns an error for a missing room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      expect(await service.joinRoom('ABCDEF', 'u-new')).toEqual({ error: '房间不存在' });
    });

    it('returns an error when the user is already in the room (pre-transaction check)', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(
        baseJoinPlayer('u-new'),
      );

      expect(await service.joinRoom('ABCDEF', 'u-new')).toEqual({ error: '你已在房间中' });
    });

    it('returns an error when the status-guarded room lock matches nothing', async () => {
      const tx = buildTx({ locked: { count: 0 } });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);

      const result = await service.joinRoom('ABCDEF', 'u-new');

      expect(result).toEqual({ error: '房间不存在或游戏已开始' });
      expect(tx.room.findUnique).not.toHaveBeenCalled();
      expect(tx.roomPlayer.create).not.toHaveBeenCalled();
    });

    it('returns an error when the room row vanishes inside the transaction', async () => {
      const tx = buildTx({ roomInTx: null });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);

      const result = await service.joinRoom('ABCDEF', 'u-new');

      expect(result).toEqual({ error: '房间不存在' });
      expect(tx.roomPlayer.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate join detected inside the transaction', async () => {
      const tx = buildTx({ playerCount: 1, existing: { id: 'p-1', userId: 'u-new' } });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);

      const result = await service.joinRoom('ABCDEF', 'u-new');

      expect(result).toEqual({ error: '你已在房间中' });
      expect(tx.roomPlayer.create).not.toHaveBeenCalled();
    });

    it('converts a seat-assignment BadRequestException into { error }', async () => {
      // Capacity check passes (4 < 5) but every seat 1-5 is occupied, so
      // assignSeat walks past maxPlayers and throws BadRequestException.
      const tx = buildTx({ playerCount: 4, occupiedSeats: [1, 2, 3, 4, 5] });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);

      const result = await service.joinRoom('ABCDEF', 'u-new');

      expect(result).toEqual({ error: '房间已满' });
      expect(tx.roomPlayer.create).not.toHaveBeenCalled();
    });

    it('rethrows non-BadRequest seat-assignment failures', async () => {
      const tx = buildTx({
        playerCount: 1,
        createImpl: jest.fn().mockRejectedValue(new Error('db down')),
      });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);

      await expect(service.joinRoom('ABCDEF', 'u-new')).rejects.toThrow('db down');
    });

    it('throws NotFound when the joining user does not exist', async () => {
      const tx = buildTx({ playerCount: 1 });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);
      mockPrisma.roomPlayer.count.mockResolvedValue(2);
      mockPrisma.roomPlayer.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.joinRoom('ABCDEF', 'u-new')).rejects.toThrow('用户不存在');
      expect(tx.roomPlayer.create).toHaveBeenCalled();
    });

    function baseJoinPlayer(userId: string) {
      return {
        id: `p-${userId}`,
        roomId: 'room-1',
        userId,
        seatNo: 1,
        role: null,
        joinedAt: new Date(),
        user: { id: userId, nickName: 'n', avatarUrl: '' },
      };
    }
  });

  describe('leaveRoom branches', () => {
    const mockRoom = {
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

    it('returns not_found for a missing room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      await expect(service.leaveRoom('ABCDEF', 'u-1')).resolves.toBe('not_found');
    });

    it('returns not_found when the leaving player has no membership row', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);

      await expect(service.leaveRoom('ABCDEF', 'ghost')).resolves.toBe('not_found');
      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes the whole room when the last member (the host) leaves', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-host', presenceVersion: 0 });
      mockPrisma.roomPlayer.findMany.mockResolvedValue([]);

      const result = await service.leaveRoom('ABCDEF', 'host-1');

      expect(result).toBe('removed');
      expect(mockPrisma.room.delete).toHaveBeenCalledWith({ where: { id: 'room-1' } });
      expect(mockRedis.del).toHaveBeenCalledWith('room:ABCDEF');
      expect(mockRedis.delWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:room:ABCDEF:presence' }),
        'room:ABCDEF:offline:host-1',
      );
    });

    it('marks a non-host offline when the room starts mid-leave', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-2', presenceVersion: 0 });
      mockPrisma.room.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.leaveRoom('ABCDEF', 'u-2');

      expect(result).toBe('offline');
      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
      expect(mockRedis.setWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:room:ABCDEF:presence' }),
        'room:ABCDEF:offline:u-2',
        expect.any(String),
      );
    });

    it('marks the caller offline when the room is already PLAYING', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...mockRoom, status: 'PLAYING' as const });
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-2', presenceVersion: 0 });

      const result = await service.leaveRoom('ABCDEF', 'u-2');

      expect(result).toBe('offline');
      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
      expect(mockRedis.setWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:room:ABCDEF:presence' }),
        'room:ABCDEF:offline:u-2',
        expect.any(String),
      );
    });

    it('skips the offline marker when leaving a PLAYING room with skipOfflineMark', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...mockRoom, status: 'PLAYING' as const });

      const result = await service.leaveRoom('ABCDEF', 'u-2', true);

      expect(result).toBe('offline');
      expect(mockRedis.setWithLock).not.toHaveBeenCalled();
    });

    it('deleteOfflineMarker falls back to an unlocked del without a lease', async () => {
      await (service as any).deleteOfflineMarker('ABCDEF', 'u-1');

      expect(mockRedis.del).toHaveBeenCalledWith('room:ABCDEF:offline:u-1');
      expect(mockRedis.delWithLock).not.toHaveBeenCalled();
    });
  });

  describe('kickPlayer lock handling and success path', () => {
    const mockRoom = {
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

    it('rejects kicks from non-hosts, self-kicks and missing rooms', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      expect(await service.kickPlayer('ABCDEF', 'host-1', 'u-2')).toEqual({ error: '房间不存在' });

      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      expect(await service.kickPlayer('ABCDEF', 'not-host', 'u-2')).toEqual({ error: '仅房主可以踢人' });
      expect(await service.kickPlayer('ABCDEF', 'host-1', 'host-1')).toEqual({ error: '房主不能踢出自己' });
      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
    });

    it('removes the kicked player and cleans their offline marker', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ presenceVersion: 3 });

      const result = await service.kickPlayer('ABCDEF', 'host-1', 'u-2');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.roomPlayer.deleteMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1', userId: 'u-2', presenceVersion: 3 },
      });
      expect(mockRedis.delWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:room:ABCDEF:presence' }),
        'room:ABCDEF:offline:u-2',
      );
    });

    it('reports not-in-room when the membership row vanished before the delete', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ presenceVersion: 0 });
      mockPrisma.roomPlayer.deleteMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.kickPlayer('ABCDEF', 'host-1', 'u-2');

      expect(result).toEqual({ error: '该玩家不在房间中' });
    });

    it('logs but still succeeds when the kicked marker cleanup fails', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ presenceVersion: 0 });
      mockRedis.delWithLock.mockRejectedValueOnce(new Error('redis down'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      const result = await service.kickPlayer('ABCDEF', 'host-1', 'u-2');

      expect(result).toEqual({ success: true });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("kicked player's offline marker"),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });

    it('returns a busy error when the presence lock is unavailable', async () => {
      mockRedis.withLock.mockRejectedValue(new Error('LOCK_BUSY'));

      const result = await service.kickPlayer('ABCDEF', 'host-1', 'u-2');

      expect(result).toEqual({ error: '玩家状态正在变更，请稍后重试' });
      expect(mockPrisma.room.findUnique).not.toHaveBeenCalled();
    });

    it('rethrows unexpected lock acquisition errors', async () => {
      mockRedis.withLock.mockRejectedValue(new Error('redis down'));

      await expect(service.kickPlayer('ABCDEF', 'host-1', 'u-2')).rejects.toThrow('redis down');
    });
  });

  describe('startGame guards, validation and rollback edges', () => {
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
    const validAvalonConfig = {
      merlin: true, percival: false, mordred: false, morgana: false,
      oberon: false, assassin: true, loyalServants: 2, minions: 1,
    };

    function makePlayers(count: number) {
      return Array.from({ length: count }, (_, i) => ({
        id: `p-${i + 1}`,
        roomId: 'room-1',
        userId: `u-${i + 1}`,
        seatNo: i + 1,
        role: null,
        joinedAt: new Date(),
      }));
    }

    it('returns an error for a missing room or non-host starter', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      expect(await service.startGame('ABCDEF', 'host-1')).toEqual({ error: '房间不存在' });

      mockPrisma.room.findUnique.mockResolvedValue(sgsRoom);
      expect(await service.startGame('ABCDEF', 'u-other')).toEqual({ error: '仅房主可以开始游戏' });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('returns a busy error and rethrows other lock failures', async () => {
      mockRedis.withLock.mockRejectedValue(new Error('LOCK_BUSY'));
      expect(await service.startGame('ABCDEF', 'host-1')).toEqual({ error: '房间状态正在变更，请稍后重试' });

      mockRedis.withLock.mockRejectedValue(new Error('redis exploded'));
      await expect(service.startGame('ABCDEF', 'host-1')).rejects.toThrow('redis exploded');
    });

    it('returns an error when the room row vanishes inside the transaction', async () => {
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(sgsRoom)  // getRoom snapshot
        .mockResolvedValueOnce(null);    // tx re-read

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '房间不存在' });
      expect(mockPrisma.roomPlayer.findMany).not.toHaveBeenCalled();
    });

    it('requires the Avalon minimum player count', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: validAvalonConfig,
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(3));

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '至少需要 5 名玩家' });
    });

    it('rejects an SGS room whose persisted config fails schema validation', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        roleConfig: { monarch: 2, loyalist: 0, rebel: 3, traitor: 0 },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(5));

      const result = await service.startGame('ABCDEF', 'host-1');

      expect((result as any).error).toContain('SGS 角色配置格式无效');
      expect(mockPrisma.gameRecord.create).not.toHaveBeenCalled();
    });

    it('rejects an Avalon room whose persisted config fails schema validation', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: { loyalServants: 99 },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(5));

      const result = await service.startGame('ABCDEF', 'host-1');

      expect((result as any).error).toContain('角色配置格式无效');
      expect(mockPrisma.gameRecord.create).not.toHaveBeenCalled();
    });

    it('rejects a player count the Avalon engine does not support', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: { merlin: true, assassin: true, loyalServants: 9, minions: 0 },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(11));

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '不支持 11 人游戏' });
      expect(mockPrisma.gameRecord.create).not.toHaveBeenCalled();
    });

    it('rejects configs with more evil specials than the evil faction can hold', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: {
          mordred: true, morgana: true, oberon: true, assassin: true,
          loyalServants: 1, minions: 0,
        },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(5));

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '邪恶角色数量(4)超过邪恶数量(2)' });
      expect(mockPrisma.gameRecord.create).not.toHaveBeenCalled();
    });

    it('returns a clean error when the Avalon engine refuses to deal the roles', async () => {
      // Faction counts are consistent (3 loyal + 2 minions) but the config has
      // no Merlin/Assassin — validateAvalonRoleConfig passes, generateRoles throws.
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: { loyalServants: 3, minions: 2 },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(5));
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '角色分配失败，请检查角色配置' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Avalon role generation failed'));
      expect(mockPrisma.gameRecord.create).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('returns an error and skips state init when no Avalon initializer is registered', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: validAvalonConfig,
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(5));
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: 'Avalon 游戏状态初始化失败' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('initializer not registered'));
      // Rollback snapshot saw WAITING → no DB reset or Redis cleanup needed.
      const resets = mockPrisma.room.updateMany.mock.calls.filter(
        (call: any) => call[0]?.data?.status === 'WAITING',
      );
      expect(resets).toHaveLength(0);
      expect(mockRedis.delJsonFieldWithLock).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('logs and falls back to a DB reset when the rollback snapshot read fails', async () => {
      const avalonRoom = {
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: validAvalonConfig,
      };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(avalonRoom)                        // getRoom snapshot
        .mockResolvedValueOnce(avalonRoom)                        // tx re-read
        .mockResolvedValueOnce(avalonRoom)                        // init tx hostId read
        .mockRejectedValueOnce(new Error('snapshot read failed')) // rollback getRoom
        .mockResolvedValue({ ...avalonRoom, status: 'PLAYING' as const });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(5));
      service.setAvalonGameInitializer({
        initializeGame: jest.fn().mockRejectedValue(new Error('redis down')),
      });
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: 'Avalon 游戏状态初始化失败' });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to roll back startGame'),
        expect.any(Error),
      );
      expect(mockPrisma.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'PLAYING' },
        data: { status: 'WAITING' },
      });
      loggerSpy.mockRestore();
    });

    it('returns a critical error when both rollback attempts fail', async () => {
      const avalonRoom = {
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: validAvalonConfig,
      };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValue({ ...avalonRoom, status: 'PLAYING' as const });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(5));
      mockPrisma.gameRecord.updateMany
        .mockResolvedValueOnce({ count: 1 })           // start tx legacy-record heal
        .mockResolvedValueOnce({ count: 0 })           // resetRoomToWaiting CAS → not owner
        .mockRejectedValueOnce(new Error('db down'));  // fallback reset throws
      service.setAvalonGameInitializer({
        initializeGame: jest.fn().mockRejectedValue(new Error('redis down')),
      });
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({
        error: 'Avalon 游戏状态初始化失败，房间可能仍是进行中状态，请尝试结束游戏或等待自动清理',
      });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });

    it('returns an error when the Avalon init transaction finds the room gone', async () => {
      const avalonRoom = {
        ...sgsRoom,
        gameType: GameType.AVALON,
        roleConfig: validAvalonConfig,
      };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValueOnce(avalonRoom)
        .mockResolvedValueOnce(null) // init tx hostId read → room vanished
        .mockResolvedValue({ ...avalonRoom, status: 'PLAYING' as const });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(makePlayers(5));
      const initializeGame = jest.fn();
      service.setAvalonGameInitializer({ initializeGame });

      const result = await service.startGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: 'Avalon 游戏状态初始化失败' });
      expect(initializeGame).not.toHaveBeenCalled();
    });

    it('rethrows unexpected transaction failures', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(sgsRoom);
      mockPrisma.roomPlayer.findMany.mockRejectedValue(new Error('db exploded'));

      await expect(service.startGame('ABCDEF', 'host-1')).rejects.toThrow('db exploded');
    });
  });

  describe('endGame lock and cleanup branches', () => {
    const mockPlayingRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'PLAYING' as const,
      gameType: GameType.AVALON,
      roleConfig: {},
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('returns a busy error and rethrows other lock failures', async () => {
      mockRedis.withLock.mockRejectedValue(new Error('LOCK_BUSY'));
      expect(await service.endGame('ABCDEF', 'host-1')).toEqual({ error: '房间状态正在变更，请稍后重试' });

      mockRedis.withLock.mockRejectedValue(new Error('redis down'));
      await expect(service.endGame('ABCDEF', 'host-1')).rejects.toThrow('redis down');
    });

    it('returns an error when there is no open game record', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockPlayingRoom);
      mockPrisma.gameRecord.findFirst.mockResolvedValue(null);

      const result = await service.endGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '当前游戏记录不存在，请刷新后重试' });
      expect(mockPrisma.room.updateMany).not.toHaveBeenCalled();
    });

    it('returns an error when the reset status guard matches nothing', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockPlayingRoom);
      mockPrisma.room.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.endGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '游戏状态已变更，请刷新后重试' });
      expect(mockPrisma.roomPlayer.updateMany).not.toHaveBeenCalled();
    });

    it('still succeeds when Avalon state deletion reports LOCK_LOST', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockPlayingRoom);
      mockRedis.delJsonFieldWithLock.mockRejectedValue(new Error('LOCK_LOST'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      const result = await service.endGame('ABCDEF', 'host-1');

      expect(result).toEqual({ success: true });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('post-commit Avalon cleanup'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });

    it('logs a generic Avalon state deletion failure without failing the end', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockPlayingRoom);
      mockRedis.delJsonFieldWithLock.mockRejectedValue(new Error('redis down'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      const result = await service.endGame('ABCDEF', 'host-1');

      expect(result).toEqual({ success: true });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete Avalon state'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });
  });

  describe('presence branches (host transfer fallbacks, markPlayerOnline)', () => {
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

    function buildPlayingPlayers() {
      return [
        { id: 'p-1', roomId: 'room-1', userId: 'host-1', seatNo: 1, role: 'Merlin', joinedAt: new Date(), user: { id: 'host-1', nickName: 'h', avatarUrl: '' } },
        { id: 'p-2', roomId: 'room-1', userId: 'u-2', seatNo: 2, role: 'LoyalServant', joinedAt: new Date(), user: { id: 'u-2', nickName: 'a', avatarUrl: '' } },
        { id: 'p-3', roomId: 'room-1', userId: 'u-3', seatNo: 3, role: 'LoyalServant', joinedAt: new Date(), user: { id: 'u-3', nickName: 'b', avatarUrl: '' } },
      ];
    }

    function mockPresenceLookup() {
      mockPrisma.roomPlayer.findFirst.mockImplementation(async ({ where }: any) => {
        const ids: Record<string, string> = { 'host-1': 'p-1', 'u-2': 'p-2', 'u-3': 'p-3' };
        return {
          id: ids[where.userId] ?? 'p-3',
          presenceVersion: where.userId === 'host-1' ? 1 : 0,
        };
      });
    }

    it('hands the host to the first remaining member when everyone else is offline', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...waitingRoom, status: 'PLAYING' as const });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayingPlayers());
      mockPresenceLookup();
      // both u-2 and u-3 have valid offline markers → no online successor
      mockRedis.get.mockImplementation(async (key: string) =>
        offlineMarker(key.endsWith(':u-2') ? 'p-2' : 'p-3'));
      const updateHost = jest.fn().mockResolvedValue(undefined);
      service.setAvalonGameInitializer({ initializeGame: jest.fn(), updateHost });

      const result = await service.markPlayerOffline('ABCDEF', 'host-1');

      expect(result).toBe(true);
      expect(mockPrisma.room.updateMany).toHaveBeenCalledWith({
        where: { id: 'room-1', status: 'PLAYING', hostId: 'host-1' },
        data: { hostId: 'u-2' },
      });
      expect(updateHost).toHaveBeenCalledWith('ABCDEF', 'u-2');
    });

    it('skips the transfer when the chosen successor is no longer a member', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...waitingRoom, status: 'PLAYING' as const });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayingPlayers());
      mockPrisma.roomPlayer.findFirst.mockImplementation(async ({ where }: any) => {
        if (where.userId === 'u-2') return null; // reads as online; also gone at transfer time
        if (where.userId === 'host-1') return { id: 'p-1', presenceVersion: 1 };
        return { id: 'p-3', presenceVersion: 0 };
      });
      mockRedis.get.mockImplementation(async (key: string) =>
        key.endsWith(':u-3') ? offlineMarker('p-3') : null);
      const updateHost = jest.fn();
      service.setAvalonGameInitializer({ initializeGame: jest.fn(), updateHost });

      const result = await service.markPlayerOffline('ABCDEF', 'host-1');

      expect(result).toBe(true);
      expect(updateHost).not.toHaveBeenCalled();
      expect(mockPrisma.room.updateMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ hostId: expect.anything() }) }),
      );
    });

    it('logs when the Avalon host sync fails after a successful transfer', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...waitingRoom, status: 'PLAYING' as const });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(buildPlayingPlayers());
      mockPresenceLookup();
      // only u-2 is offline → online u-3 becomes host
      mockRedis.get.mockImplementation(async (key: string) =>
        key.endsWith(':u-2') ? offlineMarker('p-2') : null);
      const updateHost = jest.fn().mockRejectedValue(new Error('ws down'));
      service.setAvalonGameInitializer({ initializeGame: jest.fn(), updateHost });
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      const result = await service.markPlayerOffline('ABCDEF', 'host-1');

      expect(result).toBe(true);
      expect(updateHost).toHaveBeenCalledWith('ABCDEF', 'u-3');
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to synchronize Avalon host'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });

    it('markPlayerOffline returns false for a missing room, missing row, or vanished player', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      expect(await service.markPlayerOffline('ABCDEF', 'u-1')).toBe(false);

      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.updateMany.mockResolvedValueOnce({ count: 0 });
      expect(await service.markPlayerOffline('ABCDEF', 'u-1')).toBe(false);

      mockPrisma.roomPlayer.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.roomPlayer.findFirst.mockResolvedValue(null);
      expect(await service.markPlayerOffline('ABCDEF', 'u-1')).toBe(false);
      expect(mockRedis.setWithLock).not.toHaveBeenCalled();
    });

    it('throws when a locked presence update is attempted without a lease', async () => {
      await expect(service.markPlayerOffline('ABCDEF', 'u-1', true))
        .rejects.toThrow('Presence update attempted without lock lease');
      await expect(service.markPlayerOnline('ABCDEF', 'u-1', true))
        .rejects.toThrow('Presence update attempted without lock lease');
    });

    it('markPlayerOnline clears the offline marker and bumps room activity', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markPlayerOnline('ABCDEF', 'u-1');

      expect(result).toBe(true);
      expect(mockRedis.withLock).toHaveBeenCalledWith(
        'lock:room:ABCDEF:presence',
        10_000,
        expect.any(Function),
      );
      expect(mockRedis.delWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:room:ABCDEF:presence' }),
        'room:ABCDEF:offline:u-1',
      );
      expect(mockPrisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: { updatedAt: expect.any(Date) },
      });
      expect(mockRedis.hsetWithExpire).toHaveBeenCalledWith(
        'room:ABCDEF',
        'lastActiveAt',
        expect.any(String),
        86400,
      );
    });

    it('markPlayerOnline returns false for a missing room or vanished membership', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      expect(await service.markPlayerOnline('ABCDEF', 'u-1')).toBe(false);

      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.updateMany.mockResolvedValueOnce({ count: 0 });
      expect(await service.markPlayerOnline('ABCDEF', 'u-1')).toBe(false);
      expect(mockRedis.delWithLock).not.toHaveBeenCalled();
    });
  });

  describe('updateRoomSettings validation branches', () => {
    const avalonRoom = {
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

    it('rejects an SGS config that fails schema validation', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...avalonRoom,
        gameType: GameType.SGS,
        roleConfig: { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 },
      });

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        roleConfig: { monarch: 9 },
      });

      expect((result as any).error).toContain('SGS 角色配置格式无效');
      expect(mockPrisma.room.update).not.toHaveBeenCalled();
    });

    it('rejects an Avalon config whose evil specials overflow the faction', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(avalonRoom);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        roleConfig: {
          mordred: true, morgana: true, oberon: true, assassin: true,
          loyalServants: 1, minions: 0,
        } as PartialRoleConfig,
      });

      expect(result).toEqual({ error: '邪恶角色数量(4)超过邪恶数量(2)' });
      expect(mockPrisma.room.update).not.toHaveBeenCalled();
    });

    it('returns an error when the room row vanishes inside the transaction', async () => {
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(avalonRoom) // snapshot
        .mockResolvedValueOnce(null);      // tx re-read

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        isRandomSeat: true,
      });

      expect(result).toEqual({ error: '房间不存在' });
    });
  });

  describe('cleanupIdleRooms decision branches', () => {
    const staleUpdatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const idleRoom = { id: 'room-1', code: 'ABCDEF', status: 'WAITING' };

    function arrangeStaleRoom() {
      mockPrisma.room.findMany.mockResolvedValue([idleRoom]);
      mockPrisma.room.findUnique.mockResolvedValue({ updatedAt: staleUpdatedAt });
      mockRedis.hget.mockResolvedValue(null);
    }

    it('skips rooms whose Redis lastActiveAt is recent', async () => {
      arrangeStaleRoom();
      mockRedis.hget.mockResolvedValue(String(Date.now() - 60 * 1000));
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

      await service.cleanupIdleRooms();

      expect(mockPrisma.room.deleteMany).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('recent room or game activity'),
      );
      logSpy.mockRestore();
    });

    it('skips rooms whose row disappears before the FOR UPDATE lock', async () => {
      arrangeStaleRoom();
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.cleanupIdleRooms();

      expect(mockPrisma.room.deleteMany).not.toHaveBeenCalled();
      expect(mockRedis.hget).not.toHaveBeenCalled();
    });

    it('ignores malformed Avalon state and still deletes the idle room', async () => {
      arrangeStaleRoom();
      mockPrisma.roomPlayer.findMany.mockResolvedValue([{ userId: 'u-1' }]);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-1', presenceVersion: 0 });
      mockRedis.get.mockImplementation(async (key: string) =>
        key.startsWith('avalon:') ? 'not-json{' : offlineMarker('p-1', 0, 1));
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

      await service.cleanupIdleRooms();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('malformed Avalon state'));
      expect(mockPrisma.room.deleteMany).toHaveBeenCalledWith({
        where: { id: 'room-1', updatedAt: { lt: expect.any(Date) } },
      });
      // DB deletion commits before best-effort Redis cleanup; no generation to fence.
      expect(mockRedis.del).toHaveBeenCalledWith('room:ABCDEF');
      expect(mockRedis.del).toHaveBeenCalledWith('room:ABCDEF:offline:u-1');
      expect(mockRedis.delJsonFieldWithLock).not.toHaveBeenCalled();
      warnSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('fenced-deletes the Avalon state generation after removing an idle room', async () => {
      arrangeStaleRoom();
      mockPrisma.roomPlayer.findMany.mockResolvedValue([{ userId: 'u-1' }]);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-1', presenceVersion: 0 });
      mockRedis.get.mockImplementation(async (key: string) =>
        key.startsWith('avalon:')
          ? JSON.stringify({ generationId: 'game-9' })
          : offlineMarker('p-1', 0, 1));
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

      await service.cleanupIdleRooms();

      expect(mockPrisma.room.deleteMany).toHaveBeenCalled();
      expect(mockRedis.delJsonFieldWithLock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lock:avalon:ABCDEF:state' }),
        'avalon:ABCDEF:state',
        'generationId',
        'game-9',
      );
      logSpy.mockRestore();
    });
  });

  describe('sweep guards (cleanupOfflinePlayers / cleanupOfflinePlayer)', () => {
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

    it('cleanupOfflinePlayers skips online players without touching them', async () => {
      mockPrisma.room.findMany.mockResolvedValue([{ code: 'ABCDEF' }]);
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue([
        { id: 'p-1', roomId: 'room-1', userId: 'u-1', seatNo: 1, role: null, joinedAt: new Date(), user: { id: 'u-1', nickName: 'a', avatarUrl: '' } },
      ]);
      mockRedis.get.mockResolvedValue(null); // no marker → online
      const notifier = { notifyClientsAfterLeave: jest.fn() };
      service.setEventsNotifier(notifier as never);

      await service.cleanupOfflinePlayers();

      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
      expect(notifier.notifyClientsAfterLeave).not.toHaveBeenCalled();
    });

    it('cleanupOfflinePlayer reports not_found when the room is gone and skips stale markers', async () => {
      // Marker is old enough, but the room no longer exists.
      mockPrisma.room.findUnique.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(offlineMarker('p-1', 0, 1));
      await expect(service.cleanupOfflinePlayer('ABCDEF', 'u-1')).resolves.toBe('not_found');

      // Marker is bound to a different membership row → skip.
      mockPrisma.room.findUnique.mockResolvedValue(waitingRoom);
      mockPrisma.roomPlayer.findFirst.mockResolvedValue({ id: 'p-other', presenceVersion: 0 });
      await expect(service.cleanupOfflinePlayer('ABCDEF', 'u-1')).resolves.toBe('skipped');
      expect(mockPrisma.roomPlayer.deleteMany).not.toHaveBeenCalled();
    });
  });
});
