import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService, RoomInfo, PlayerInfo } from './room.service';
import { RoomGateway } from './room.gateway';
import { AuthGuard } from '../auth/auth.guard';
import { PartialRoleConfig } from './role-config.schema';

describe('RoomController', () => {
  let controller: RoomController;
  let roomService: jest.Mocked<RoomService>;
  let roomGateway: jest.Mocked<RoomGateway>;

  const mockRoom: RoomInfo = {
    id: 'room-1',
    code: 'ABC123',
    hostId: 'user-1',
    status: 'WAITING',
    gameType: 'AVALON',
    roleConfig: {
      merlin: true,
      percival: false,
      mordred: false,
      morgana: false,
      oberon: false,
      assassin: false,
      loyalServants: 3,
      minions: 2,
    },
    maxPlayers: 8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPlayers: PlayerInfo[] = [
    {
      id: 'player-1',
      userId: 'user-1',
      seatNo: 1,
      isOnline: true,
      joinedAt: new Date('2024-01-01'),
      user: { id: 'user-1', nickName: 'Host', avatarUrl: 'https://example.com/1.png' },
    },
  ];

  const mockReq = { user: { id: 'user-1' } };

  beforeEach(async () => {
    const mockService = {
      createRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updateRoomSettings: jest.fn(),
      getRoom: jest.fn(),
      getPlayers: jest.fn(),
      joinRoom: jest.fn(),
      startGame: jest.fn(),
      kickPlayer: jest.fn(),
      getPlayer: jest.fn(),
      getPlayerCount: jest.fn(),
      restartGame: jest.fn(),
    };
    const mockGateway = {
      broadcastRoomState: jest.fn(),
      evictUserFromRoom: jest.fn(),
      notifyClientsAfterKick: jest.fn().mockResolvedValue(undefined),
      notifyClientsAfterRestart: jest.fn().mockResolvedValue(undefined),
      server: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        { provide: RoomService, useValue: mockService },
        { provide: RoomGateway, useValue: mockGateway },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RoomController>(RoomController);
    roomService = module.get(RoomService) as jest.Mocked<RoomService>;
    roomGateway = module.get(RoomGateway) as jest.Mocked<RoomGateway>;
  });

  describe('PATCH /rooms/:code/settings', () => {
    it('host updates settings successfully → 200 with room detail', async () => {
      roomService.updateRoomSettings.mockResolvedValue(mockRoom);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      const result = await controller.updateRoomSettings(mockReq, 'ABC123', {
        maxPlayers: 8,
        roleConfig: { merlin: true, loyalServants: 3, minions: 2 },
      });

      expect(roomService.updateRoomSettings).toHaveBeenCalledWith(
        'ABC123',
        'user-1',
        { maxPlayers: 8, roleConfig: { merlin: true, loyalServants: 3, minions: 2 } },
      );
      expect(result).toMatchObject({
        id: 'room-1',
        code: 'ABC123',
        status: 'WAITING',
        maxPlayers: 8,
        host: { id: 'user-1', nickName: 'Host', avatarUrl: 'https://example.com/1.png' },
      });
      expect(result.players).toHaveLength(1);
    });

    it('non-host tries to update → 403 ForbiddenException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({ error: '仅房主可以修改设置' });

      await expect(
        controller.updateRoomSettings(mockReq, 'ABC123', { maxPlayers: 8 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('invalid roleConfig → 400 BadRequestException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({
        error: '角色配置格式无效: loyalServants 必须大于等于 0',
      });

      await expect(
        controller.updateRoomSettings(mockReq, 'ABC123', {
          roleConfig: { loyalServants: -1 },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('maxPlayers < current players → 400 BadRequestException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({
        error: '当前已有6名玩家，无法减少至5人',
      });

      await expect(
        controller.updateRoomSettings(mockReq, 'ABC123', { maxPlayers: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('game already started → 400 BadRequestException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({
        error: '游戏已开始，无法修改设置',
      });

      await expect(
        controller.updateRoomSettings(mockReq, 'ABC123', { maxPlayers: 8 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('room not found → 404 NotFoundException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({ error: '房间不存在' });

      await expect(
        controller.updateRoomSettings(mockReq, 'NOTFOUND', { maxPlayers: 8 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /rooms', () => {
    it('valid create → 200 with room data', async () => {
      roomService.createRoom.mockResolvedValue(mockRoom);

      const result = await controller.createRoom(mockReq, {
        roleConfig: { merlin: true, loyalServants: 3, minions: 2 },
        maxPlayers: 8,
      });

      expect(roomService.createRoom).toHaveBeenCalledWith(
        'user-1',
        { merlin: true, loyalServants: 3, minions: 2 },
        8,
        undefined,
      );
      expect(result).toEqual({
        id: 'room-1',
        code: 'ABC123',
        status: 'WAITING',
        gameType: 'AVALON',
        roleConfig: mockRoom.roleConfig,
        maxPlayers: 8,
        createdAt: mockRoom.createdAt,
      });
    });

    it('invalid roleConfig → 400 BadRequestException', async () => {
      roomService.createRoom.mockResolvedValue({
        error: '角色配置格式无效: Number must be greater than or equal to 0',
      } as any);

      await expect(
        controller.createRoom(mockReq, { roleConfig: { loyalServants: -1 } as PartialRoleConfig }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /rooms/:code/leave', () => {
    it('leaves the room and broadcasts refreshed room state', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.getPlayerCount.mockResolvedValue(1);

      const result = await controller.leaveRoom(mockReq, 'abc123');

      expect(roomService.leaveRoom).toHaveBeenCalledWith('ABC123', 'user-1');
      expect(roomGateway.evictUserFromRoom).toHaveBeenCalledWith('user-1', 'ABC123');
      expect(roomGateway.broadcastRoomState).toHaveBeenCalledWith('ABC123');
      expect(result).toEqual({ success: true });
    });

    it('room not found → 404 NotFoundException', async () => {
      roomService.getRoom.mockResolvedValue(null);

      await expect(controller.leaveRoom(mockReq, 'NOTEXIST')).rejects.toThrow(NotFoundException);
    });

    it('user not in room → 400 BadRequestException', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(null);

      await expect(controller.leaveRoom(mockReq, 'abc123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /rooms/:code/kick', () => {
    it('kicks player and notifies socket clients', async () => {
      roomService.kickPlayer.mockResolvedValue({ success: true });

      const result = await controller.kickPlayer(mockReq, 'abc123', { userId: 'user-2' });

      expect(roomService.kickPlayer).toHaveBeenCalledWith('ABC123', 'user-1', 'user-2');
      expect(roomGateway.notifyClientsAfterKick).toHaveBeenCalledWith('ABC123', 'user-2');
      expect(result).toEqual({ success: true });
    });

    it('service error → 400 BadRequestException', async () => {
      roomService.kickPlayer.mockResolvedValue({ error: '仅房主可以踢人' });

      await expect(
        controller.kickPlayer(mockReq, 'abc123', { userId: 'user-2' }),
      ).rejects.toThrow(BadRequestException);
      expect(roomGateway.notifyClientsAfterKick).not.toHaveBeenCalled();
    });
  });

  describe('POST /rooms/:code/restart', () => {
    it('host restarts game successfully → 200 with assignments', async () => {
      const mockAssignments = [
        { seatNo: 1, userId: 'user-1', role: '主公', team: 'good' as const },
      ];
      roomService.restartGame.mockResolvedValue({ assignments: mockAssignments });

      const result = await controller.restartGame(mockReq, 'abc123');

      expect(roomService.restartGame).toHaveBeenCalledWith('ABC123', 'user-1');
      expect(roomGateway.notifyClientsAfterRestart).toHaveBeenCalledWith('ABC123', mockAssignments);
      expect(result).toEqual({ assignments: mockAssignments });
    });

    it('service error → 400 BadRequestException', async () => {
      roomService.restartGame.mockResolvedValue({ error: '游戏尚未开始' });

      await expect(controller.restartGame(mockReq, 'abc123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
