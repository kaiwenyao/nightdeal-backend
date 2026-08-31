import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService, RoomInfo, PlayerInfo } from './room.service';
import { RoomGateway } from './room.gateway';
import { AuthGuard } from '../auth/auth.guard';
import { PartialRoleConfig } from './role-config.schema';
import { GameType } from '../../prisma/generated/prisma/client.js';

describe('RoomController', () => {
  let controller: RoomController;
  let roomService: jest.Mocked<RoomService>;
  let roomGateway: jest.Mocked<RoomGateway>;

  const mockRoom: RoomInfo = {
    id: 'room-1',
    code: 'ABCDEF',
    hostId: 'user-1',
    status: 'WAITING',
    gameType: GameType.AVALON,
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
    isRandomSeat: false,
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
      endGame: jest.fn(),
    };
    const mockGateway = {
      broadcastRoomState: jest.fn(),
      evictUserFromRoom: jest.fn(),
      notifyClientsAfterKick: jest.fn().mockResolvedValue(undefined),
      notifyClientsAfterStart: jest.fn().mockResolvedValue(undefined),
      notifyClientsAfterEnd: jest.fn().mockResolvedValue(undefined),
      notifyClientsAfterSettingsUpdate: jest.fn().mockResolvedValue(undefined),
      notifyClientsAfterJoin: jest.fn().mockResolvedValue(undefined),
      notifyClientsAfterLeave: jest.fn().mockResolvedValue(undefined),
      notifyClientsAfterOffline: jest.fn().mockResolvedValue(undefined),
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


  describe('POST /rooms/:code/join', () => {
    const joinPlayer: PlayerInfo = {
      id: 'player-2',
      userId: 'user-2',
      seatNo: 2,
      isOnline: true,
      joinedAt: new Date('2024-01-01'),
      user: { id: 'user-2', nickName: 'Guest', avatarUrl: 'https://example.com/2.png' },
    };

    it('successful join broadcasts and returns room detail', async () => {
      roomService.joinRoom.mockResolvedValue({
        roomState: { room: mockRoom, players: [...mockPlayers, joinPlayer] },
        player: joinPlayer,
        playerCount: 2,
      });
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue([...mockPlayers, joinPlayer]);

      const result = await controller.joinRoom({ user: { id: 'user-2' } }, 'abcdef');

      expect(roomGateway.notifyClientsAfterJoin).toHaveBeenCalledWith('ABCDEF', joinPlayer, 2);
      expect(result.code).toBe('ABCDEF');
    });

    it('already in room → 409 ConflictException', async () => {
      roomService.joinRoom.mockResolvedValue({ error: '你已在房间中' });

      await expect(controller.joinRoom(mockReq, 'ABCDEF')).rejects.toThrow(ConflictException);
      expect(roomGateway.notifyClientsAfterJoin).not.toHaveBeenCalled();
    });

    it('room not found → 404 NotFoundException', async () => {
      roomService.joinRoom.mockResolvedValue({ error: '房间不存在' });

      await expect(controller.joinRoom(mockReq, 'ABCDEF')).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /rooms/:code/settings', () => {
    it('host updates settings successfully → 200 with room detail', async () => {
      roomService.updateRoomSettings.mockResolvedValue(mockRoom);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      const result = await controller.updateRoomSettings(mockReq, 'ABCDEF', {
        maxPlayers: 8,
        roleConfig: { merlin: true, loyalServants: 3, minions: 2 },
      });

      expect(roomService.updateRoomSettings).toHaveBeenCalledWith(
        'ABCDEF',
        'user-1',
        { maxPlayers: 8, roleConfig: { merlin: true, loyalServants: 3, minions: 2 } },
      );
      expect(roomGateway.notifyClientsAfterSettingsUpdate).toHaveBeenCalledWith(
        'ABCDEF',
        mockRoom.maxPlayers,
        mockRoom.roleConfig,
        mockRoom.isRandomSeat,
      );
      expect(roomGateway.broadcastRoomState).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'room-1',
        code: 'ABCDEF',
        status: 'WAITING',
        maxPlayers: 8,
        host: { id: 'user-1', nickName: 'Host', avatarUrl: 'https://example.com/1.png' },
      });
      expect(result.players).toHaveLength(1);
    });

    it('non-host tries to update → 403 ForbiddenException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({ error: '仅房主可以修改设置' });

      await expect(
        controller.updateRoomSettings(mockReq, 'ABCDEF', { maxPlayers: 8 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('invalid roleConfig → 400 BadRequestException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({
        error: '角色配置格式无效: loyalServants 必须大于等于 0',
      });

      await expect(
        controller.updateRoomSettings(mockReq, 'ABCDEF', {
          roleConfig: { loyalServants: -1 },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('maxPlayers < current players → 400 BadRequestException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({
        error: '当前已有6名玩家，无法减少至5人',
      });

      await expect(
        controller.updateRoomSettings(mockReq, 'ABCDEF', { maxPlayers: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('game already started → 400 BadRequestException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({
        error: '游戏已开始，无法修改设置',
      });

      await expect(
        controller.updateRoomSettings(mockReq, 'ABCDEF', { maxPlayers: 8 }),
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
        undefined,
      );
      expect(result).toEqual({
        id: 'room-1',
        code: 'ABCDEF',
        status: 'WAITING',
        gameType: 'AVALON',
        roleConfig: mockRoom.roleConfig,
        maxPlayers: 8,
        isRandomSeat: false,
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
      roomService.leaveRoom.mockResolvedValue('removed');

      const result = await controller.leaveRoom(mockReq, 'abcdef');

      expect(roomService.leaveRoom).toHaveBeenCalledWith('ABCDEF', 'user-1');
      expect(roomGateway.notifyClientsAfterLeave).toHaveBeenCalledWith('ABCDEF', 'user-1');
      expect(result).toEqual({ success: true });
    });

    it('reports PLAYING leave as offline without a player-left notification', async () => {
      roomService.getRoom.mockResolvedValue({ ...mockRoom, status: 'PLAYING' });
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.leaveRoom.mockResolvedValue('offline');

      await controller.leaveRoom(mockReq, 'abcdef');

      expect(roomGateway.notifyClientsAfterOffline).toHaveBeenCalledWith('ABCDEF', 'user-1');
      expect(roomGateway.notifyClientsAfterLeave).not.toHaveBeenCalled();
    });

    it('room not found → 404 NotFoundException', async () => {
      roomService.getRoom.mockResolvedValue(null);

      await expect(controller.leaveRoom(mockReq, 'NOTEXIST')).rejects.toThrow(NotFoundException);
    });

    it('user not in room → 400 BadRequestException', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(null);

      await expect(controller.leaveRoom(mockReq, 'abcdef')).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /rooms/:code/kick', () => {
    it('kicks player and notifies socket clients', async () => {
      roomService.kickPlayer.mockResolvedValue({ success: true });

      const result = await controller.kickPlayer(mockReq, 'abcdef', { userId: 'user-2' });

      expect(roomService.kickPlayer).toHaveBeenCalledWith('ABCDEF', 'user-1', 'user-2');
      expect(roomGateway.notifyClientsAfterKick).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(result).toEqual({ success: true });
    });

    it('service error → 400 BadRequestException', async () => {
      roomService.kickPlayer.mockResolvedValue({ error: '仅房主可以踢人' });

      await expect(
        controller.kickPlayer(mockReq, 'abcdef', { userId: 'user-2' }),
      ).rejects.toThrow(BadRequestException);
      expect(roomGateway.notifyClientsAfterKick).not.toHaveBeenCalled();
    });
  });

  describe('POST /rooms/:code/end', () => {
    it('host ends game successfully → 200 success', async () => {
      roomService.endGame.mockResolvedValue({ success: true });

      const result = await controller.endGame(mockReq, 'abcdef');

      expect(roomService.endGame).toHaveBeenCalledWith('ABCDEF', 'user-1');
      expect(roomGateway.notifyClientsAfterEnd).toHaveBeenCalledWith('ABCDEF');
      expect(result).toEqual({ success: true });
    });

    it('service error → 400 BadRequestException', async () => {
      roomService.endGame.mockResolvedValue({ error: '游戏尚未开始' });

      await expect(controller.endGame(mockReq, 'abcdef')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('POST /rooms/:code/start', () => {
    it('host starts game successfully → 200 success', async () => {
      const mockAssignments = [
        { seatNo: 1, userId: 'user-1', role: '梅林', team: 'good' as const },
      ];
      roomService.startGame.mockResolvedValue({
        assignments: mockAssignments,
        gameType: GameType.AVALON,
      });

      const result = await controller.startGame(mockReq, 'abcdef');

      expect(roomService.startGame).toHaveBeenCalledWith('ABCDEF', 'user-1');
      // gameType is forwarded so roles still reach players if the state broadcast fails.
      expect(roomGateway.notifyClientsAfterStart).toHaveBeenCalledWith(
        'ABCDEF',
        mockAssignments,
        GameType.AVALON,
      );
      expect(result).toEqual({ success: true });
    });

    it('service error → 400 BadRequestException', async () => {
      roomService.startGame.mockResolvedValue({ error: '仅房主可以开始游戏' });

      await expect(controller.startGame(mockReq, 'abcdef')).rejects.toThrow(
        BadRequestException,
      );
      expect(roomGateway.notifyClientsAfterStart).not.toHaveBeenCalled();
    });
  });

  describe('POST /rooms/:code/join - other service errors', () => {
    it('generic join failure → 400 BadRequestException', async () => {
      roomService.joinRoom.mockResolvedValue({ error: '房间已满' });

      await expect(controller.joinRoom(mockReq, 'ABCDEF')).rejects.toThrow(
        BadRequestException,
      );
      expect(roomGateway.notifyClientsAfterJoin).not.toHaveBeenCalled();
    });

    it('room vanishing before the detail read → 404 NotFoundException', async () => {
      roomService.joinRoom.mockResolvedValue({
        roomState: { room: mockRoom, players: mockPlayers },
        player: mockPlayers[0],
        playerCount: 1,
      });
      roomService.getRoom.mockResolvedValue(null);

      await expect(controller.joinRoom(mockReq, 'ABCDEF')).rejects.toThrow(
        NotFoundException,
      );
      expect(roomGateway.notifyClientsAfterJoin).toHaveBeenCalled();
    });
  });

  describe('POST /rooms/:code/leave - not_found outcome', () => {
    it('membership lost mid-leave → 400 BadRequestException', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.leaveRoom.mockResolvedValue('not_found');

      await expect(controller.leaveRoom(mockReq, 'ABCDEF')).rejects.toThrow(
        BadRequestException,
      );
      expect(roomGateway.notifyClientsAfterLeave).not.toHaveBeenCalled();
      expect(roomGateway.notifyClientsAfterOffline).not.toHaveBeenCalled();
    });
  });

  describe('PUT /rooms/:code/settings', () => {
    it('routes through the same update path as PATCH', async () => {
      roomService.updateRoomSettings.mockResolvedValue(mockRoom);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      const result = await controller.putRoomSettings(mockReq, 'abcdef', { maxPlayers: 6 });

      expect(roomService.updateRoomSettings).toHaveBeenCalledWith(
        'ABCDEF',
        'user-1',
        { maxPlayers: 6, roleConfig: undefined, isRandomSeat: undefined },
      );
      expect(roomGateway.notifyClientsAfterSettingsUpdate).toHaveBeenCalledWith(
        'ABCDEF',
        mockRoom.maxPlayers,
        mockRoom.roleConfig,
        mockRoom.isRandomSeat,
      );
      expect(result.code).toBe('ABCDEF');
    });

    it('service error → 400 BadRequestException', async () => {
      roomService.updateRoomSettings.mockResolvedValue({ error: '角色配置格式无效' });

      await expect(
        controller.putRoomSettings(mockReq, 'ABCDEF', { maxPlayers: 6 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /rooms/:code/my-role', () => {
    it('returns role and seat for a member while the game is playing', async () => {
      roomService.getRoom.mockResolvedValue({ ...mockRoom, status: 'PLAYING' });
      roomService.getPlayer.mockResolvedValue({ ...mockPlayers[0], role: '梅林' });

      const result = await controller.getMyRole(mockReq, 'abcdef');

      expect(roomService.getRoom).toHaveBeenCalledWith('ABCDEF');
      expect(result).toEqual({ role: '梅林', seatNo: 1 });
    });

    it('room not found → 404 NotFoundException', async () => {
      roomService.getRoom.mockResolvedValue(null);

      await expect(controller.getMyRole(mockReq, 'NOTEXIST')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('game not started → 403 ForbiddenException', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom); // status WAITING

      await expect(controller.getMyRole(mockReq, 'ABCDEF')).rejects.toThrow(
        ForbiddenException,
      );
      expect(roomService.getPlayer).not.toHaveBeenCalled();
    });

    it('requester is not a member → 403 ForbiddenException', async () => {
      roomService.getRoom.mockResolvedValue({ ...mockRoom, status: 'PLAYING' });
      roomService.getPlayer.mockResolvedValue(null);

      await expect(controller.getMyRole(mockReq, 'ABCDEF')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /rooms/:code', () => {
    it('returns room detail for a member', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      const result = await controller.getRoom({ user: { id: 'user-2' } }, 'abcdef');

      expect(result.code).toBe('ABCDEF');
      expect(result.host).toEqual({
        id: 'user-1',
        nickName: 'Host',
        avatarUrl: 'https://example.com/1.png',
      });
    });

    it('room not found → 404 NotFoundException', async () => {
      roomService.getRoom.mockResolvedValue(null);

      await expect(controller.getRoom(mockReq, 'NOTEXIST')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('non-member requester → 403 ForbiddenException', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(null);

      await expect(controller.getRoom({ user: { id: 'user-9' } }, 'ABCDEF')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns host: null and omits missing joinedAt when rows are incomplete', async () => {
      const guestWithoutHostRow: PlayerInfo = {
        id: 'player-2',
        userId: 'user-2',
        seatNo: 2,
        isOnline: true,
        joinedAt: null as any,
        user: { id: 'user-2', nickName: 'Guest', avatarUrl: 'https://example.com/2.png' },
      };
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(null); // host without a player row is allowed
      roomService.getPlayers.mockResolvedValue([guestWithoutHostRow]);

      const result = await controller.getRoom(mockReq, 'ABCDEF');

      expect(result.host).toBeNull();
      expect(result.players).toHaveLength(1);
      expect(result.players[0].joinedAt).toBeUndefined();
    });
  });
});
