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
      findMany: jest.fn(),
      delete: jest.fn(),
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
    },
    $transaction: jest.fn(),
  };

  const mockRedis = {
    hset: jest.fn().mockResolvedValue(undefined),
    hget: jest.fn().mockResolvedValue(null),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));

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
      expect(mockRedis.hset).toHaveBeenCalledWith(expect.stringMatching(/^room:[A-Z0-9]{6}$/), 'status', 'WAITING');
      expect(mockRedis.hset).toHaveBeenCalledWith(expect.stringMatching(/^room:[A-Z0-9]{6}$/), 'hostId', 'host-1');
      expect(mockRedis.hset).toHaveBeenCalledWith(expect.stringMatching(/^room:[A-Z0-9]{6}$/), 'playerCount', '1');
    });

    it('rejects Avalon when maxPlayers below minimum', async () => {
      const result = await service.createRoom('host-1', undefined, 4, GameType.AVALON);

      expect(result).toEqual({ error: '房间人数需在 5-10 人之间' });
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
      mockPrisma.room.update.mockResolvedValue({ ...mockRoom, maxPlayers: 10 });
      mockPrisma.roomPlayer.count.mockResolvedValue(3);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 10,
        roleConfig: { merlin: true, percival: true, loyalServants: 5, minions: 3 } as PartialRoleConfig,
      });

      expect(result).toHaveProperty('maxPlayers', 10);
      expect(mockPrisma.room.update).toHaveBeenCalled();
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
      mockPrisma.room.update.mockResolvedValue(updatedSgs);
      mockPrisma.roomPlayer.count.mockResolvedValue(1);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 2,
      });

      expect(result).toHaveProperty('maxPlayers', 2);
      expect(mockPrisma.room.update).toHaveBeenCalled();
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
      mockPrisma.room.update.mockResolvedValue({ ...mockRoom, maxPlayers: 7 });
      mockPrisma.roomPlayer.count.mockResolvedValue(3);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        maxPlayers: 7,
      });

      expect(result).toHaveProperty('maxPlayers', 7);
      expect(mockRedis.hset).toHaveBeenCalledWith('room:ABCDEF', 'maxPlayers', '7');
    });

    it('with only roleConfig works', async () => {
      const newConfig = { merlin: true, percival: true, mordred: true, loyalServants: 3, minions: 2 };
      mockPrisma.room.findUnique
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce({ ...mockRoom, roleConfig: newConfig });
      mockPrisma.room.update.mockResolvedValue({ ...mockRoom, roleConfig: newConfig });

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        roleConfig: newConfig as PartialRoleConfig,
      });

      expect(result).toHaveProperty('roleConfig');
      expect(mockPrisma.room.update).toHaveBeenCalled();
    });

    it('with no changes returns current room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {});

      expect(result).toHaveProperty('id', 'room-1');
      expect(result).toHaveProperty('code', 'ABCDEF');
      expect(mockPrisma.room.update).not.toHaveBeenCalled();
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
      mockPrisma.room.update.mockResolvedValue({ ...sgsRoom, roleConfig: newSgsConfig });

      const result = await service.updateRoomSettings('ABCDEF', 'host-1', {
        roleConfig: newSgsConfig,
      });

      expect('error' in result).toBe(false);
      expect(mockPrisma.room.update).toHaveBeenCalled();
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

    it('deletes the room player and updates cached player count', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockRoom);
      mockPrisma.roomPlayer.count.mockResolvedValue(1);

      await service.leaveRoom('ABCDEF', 'user-1');

      expect(mockPrisma.roomPlayer.deleteMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1', userId: 'user-1' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('room:ABCDEF:offline:user-1');
      expect(mockRedis.hset).toHaveBeenCalledWith('room:ABCDEF', 'playerCount', '1');
    });
  });

  describe('restartGame', () => {
    const mockSgsRoom = {
      id: 'room-1',
      code: 'ABCDEF',
      hostId: 'host-1',
      status: 'PLAYING' as const,
      gameType: GameType.SGS,
      roleConfig: { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 },
      maxPlayers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAvalonRoom = {
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

    const mockPlayers = [
      { id: 'p1', userId: 'u1', seatNo: 1, isOnline: true, joinedAt: new Date(), user: { id: 'u1', nickName: 'P1', avatarUrl: '' } },
      { id: 'p2', userId: 'u2', seatNo: 2, isOnline: true, joinedAt: new Date(), user: { id: 'u2', nickName: 'P2', avatarUrl: '' } },
      { id: 'p3', userId: 'u3', seatNo: 3, isOnline: true, joinedAt: new Date(), user: { id: 'u3', nickName: 'P3', avatarUrl: '' } },
      { id: 'p4', userId: 'u4', seatNo: 4, isOnline: true, joinedAt: new Date(), user: { id: 'u4', nickName: 'P4', avatarUrl: '' } },
      { id: 'p5', userId: 'u5', seatNo: 5, isOnline: true, joinedAt: new Date(), user: { id: 'u5', nickName: 'P5', avatarUrl: '' } },
    ];

    it('SGS room → returns role assignments', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockSgsRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(mockPlayers);
      mockPrisma.roomPlayer.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.assignments).toHaveLength(5);
        expect(result.assignments.map(a => a.role)).toContain('主公');
        expect(result.assignments.map(a => a.role)).toContain('忠臣');
        expect(result.assignments.map(a => a.role)).toContain('内奸');
        expect(result.assignments.map(a => a.role)).toContain('反贼');
      }
      expect(mockPrisma.gameRecord.create).toHaveBeenCalled();
      expect(mockPrisma.roomPlayer.updateMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
        data: { role: null },
      });
    });

    it('Avalon room → returns role assignments', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockAvalonRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(mockPlayers);
      mockPrisma.roomPlayer.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.assignments).toHaveLength(5);
      }
      expect(mockPrisma.gameRecord.create).toHaveBeenCalled();
      expect(mockPrisma.roomPlayer.updateMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
        data: { role: null },
      });
    });

    it('non-existent room → returns error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '房间不存在' });
    });

    it('non-host → returns error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockSgsRoom);

      const result = await service.restartGame('ABCDEF', 'other-user');

      expect(result).toEqual({ error: '仅房主可以重开游戏' });
    });

    it('room not in PLAYING → returns error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ ...mockSgsRoom, status: 'WAITING' });

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '游戏尚未开始' });
    });

    it('Avalon room with less than 5 players → returns error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockAvalonRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(mockPlayers.slice(0, 3));

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '至少需要 5 名玩家' });
    });

    it('SGS room with 3 players → returns role assignments', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...mockSgsRoom,
        roleConfig: { monarch: 1, loyalist: 2, rebel: 0, traitor: 0 },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(mockPlayers.slice(0, 3));
      mockPrisma.roomPlayer.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.assignments).toHaveLength(3);
      }
      expect(mockPrisma.gameRecord.create).toHaveBeenCalled();
    });

    it('SGS room with 1 player → returns error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(mockSgsRoom);
      mockPrisma.roomPlayer.findMany.mockResolvedValue(mockPlayers.slice(0, 1));

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect(result).toEqual({ error: '至少需要 2 名玩家' });
    });

    it('invalid SGS roleConfig in room → returns friendly error', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...mockSgsRoom,
        roleConfig: { monarch: 2, loyalist: 1, rebel: 1, traitor: 1 },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(mockPlayers);

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('SGS 角色配置格式无效');
    });

    it('SGS room with 4-player default config (1 monarch) → passes schema and assigns roles', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        ...mockSgsRoom,
        roleConfig: { monarch: 1, loyalist: 1, rebel: 2, traitor: 0 },
      });
      mockPrisma.roomPlayer.findMany.mockResolvedValue(mockPlayers.slice(0, 4));
      mockPrisma.roomPlayer.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.restartGame('ABCDEF', 'host-1');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.assignments).toHaveLength(4);
        expect(result.assignments.filter(a => a.role === '主公')).toHaveLength(1);
        expect(result.assignments.filter(a => a.role === '忠臣')).toHaveLength(1);
        expect(result.assignments.filter(a => a.role === '反贼')).toHaveLength(2);
      }
      expect(mockPrisma.gameRecord.create).toHaveBeenCalled();
    });
  });
});
