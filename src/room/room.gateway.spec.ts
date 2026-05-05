import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { RoomGateway } from './room.gateway';
import { RoomService, RoomInfo, PlayerInfo } from './room.service';
import { AuthService } from '../auth/auth.service';
import { GameType } from '../../prisma/generated/prisma/client.js';

describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let roomService: jest.Mocked<RoomService>;
  let authService: jest.Mocked<AuthService>;
  let mockServer: jest.Mocked<Namespace>;
  let mockClient: jest.Mocked<Socket>;

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
      assassin: true,
      loyalServants: 2,
      minions: 1,
    },
    maxPlayers: 5,
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

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis() as any,
      emit: jest.fn(),
      adapter: {
        rooms: new Map([['ABCDEF', new Set(['socket-1', 'socket-2'])]]),
      },
      sockets: new Map(),
    } as any;

    mockClient = {
      id: 'socket-1',
      data: { userId: 'user-2' },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis() as any,
      disconnect: jest.fn(),
      handshake: { auth: { token: 'valid-token' }, query: {} },
    } as any;

    const mockRoomService = {
      getRoom: jest.fn(),
      getPlayers: jest.fn(),
      getPlayer: jest.fn(),
      getPlayerCount: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      isPlayerOffline: jest.fn(),
      markPlayerOnline: jest.fn(),
      markPlayerOffline: jest.fn(),
      updateRoomSettings: jest.fn(),
      kickPlayer: jest.fn(),
      startGame: jest.fn(),
      endGame: jest.fn(),
      getUserRooms: jest.fn(),
      updatePlayerInfo: jest.fn(),
    };

    const mockAuthService = {
      verifyToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomGateway,
        { provide: RoomService, useValue: mockRoomService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    gateway = module.get<RoomGateway>(RoomGateway);
    roomService = module.get(RoomService) as jest.Mocked<RoomService>;
    authService = module.get(AuthService) as jest.Mocked<AuthService>;

    // Inject mock server
    (gateway as any).server = mockServer;

    authService.verifyToken.mockResolvedValue('user-2');
  });

  describe('broadcastRoomState', () => {
    it('broadcasts room state to all clients in the room', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.broadcastRoomState('ABCDEF');

      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith('room:state', {
        room: mockRoom,
        players: mockPlayers,
      });
    });

    it('logs a warning when room is not found', async () => {
      roomService.getRoom.mockResolvedValue(null);

      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');
      await gateway.broadcastRoomState('NOTFOUND');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('room NOTFOUND not found'),
      );
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleJoin - existing player reconnection', () => {
    it('broadcasts room state and emits reconnected event for offline player returning', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.isPlayerOffline.mockResolvedValue(true);
      roomService.markPlayerOnline.mockResolvedValue(undefined);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.join).toHaveBeenCalledWith('ABCDEF');
      expect(roomService.markPlayerOnline).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(mockServer.emit).toHaveBeenCalledWith('room:state', expect.any(Object));
      expect(mockServer.emit).toHaveBeenCalledWith('room:reconnected', { userId: 'user-2' });
    });

    it('broadcasts room state for already-online player rejoining', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.isPlayerOffline.mockResolvedValue(false);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.join).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith('room:state', expect.any(Object));
    });
  });

  describe('handleJoin - new player', () => {
    it('broadcasts room state and emits player-joined for new player', async () => {
      const newPlayer: PlayerInfo = {
        id: 'player-2',
        userId: 'user-2',
        seatNo: 2,
        isOnline: true,
        joinedAt: new Date(),
        user: { id: 'user-2', nickName: 'Player2', avatarUrl: 'https://example.com/2.png' },
      };

      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(null);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      roomService.getPlayerCount
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);
      roomService.joinRoom.mockResolvedValue({
        roomState: { room: mockRoom, players: mockPlayers },
        player: newPlayer,
        playerCount: 2,
      });

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.join).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith('room:state', expect.any(Object));
      // player-joined is emitted via client.to(room).emit(), not server.emit()
      expect(mockClient.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockClient.emit).toHaveBeenCalledWith('room:player-joined', {
        player: newPlayer,
        playerCount: 2,
      });
    });
  });

  describe('handleLeave', () => {
    it('emits player-left and broadcasts room state', async () => {
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(roomService.leaveRoom).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(mockClient.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockClient.emit).toHaveBeenCalledWith('room:player-left', {
        userId: 'user-2',
        playerCount: 1,
      });
    });
  });

  describe('handleKick', () => {
    it('emits player-left via server and broadcasts room state after kick', async () => {
      roomService.kickPlayer.mockResolvedValue({ success: true });
      roomService.getPlayerCount.mockResolvedValue(1);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleKick(mockClient, {
        roomCode: 'ABCDEF',
        targetUserId: 'user-3',
      });

      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith('room:player-left', {
        userId: 'user-3',
        playerCount: 1,
      });
      expect(mockServer.emit).toHaveBeenCalledWith('room:state', {
        room: mockRoom,
        players: mockPlayers,
      });
    });
  });

  describe('handleSettingsUpdate', () => {
    it('broadcasts settings update to room members', async () => {
      roomService.updateRoomSettings.mockResolvedValue({
        ...mockRoom,
        maxPlayers: 8,
        roleConfig: { ...mockRoom.roleConfig, loyalServants: 4 },
      });

      await gateway.handleSettingsUpdate(mockClient, {
        roomCode: 'ABCDEF',
        maxPlayers: 8,
        roleConfig: { loyalServants: 4 },
      });

      expect(mockClient.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockClient.emit).toHaveBeenCalledWith('room:settings-updated', expect.objectContaining({
        maxPlayers: 8,
      }));
    });

    it('emits error for invalid settings', async () => {
      roomService.updateRoomSettings.mockResolvedValue({
        error: '角色配置格式无效',
      });

      await gateway.handleSettingsUpdate(mockClient, {
        roomCode: 'ABCDEF',
        roleConfig: { loyalServants: -1 },
      });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '角色配置格式无效',
      });
    });
  });

  describe('handleEnd', () => {
    it('success → broadcasts room:state then room:ended', async () => {
      roomService.endGame.mockResolvedValue({ success: true });
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      const broadcastSpy = jest.spyOn(gateway, 'broadcastRoomState').mockResolvedValue(undefined);

      await gateway.handleEnd(mockClient, { roomCode: 'ABCDEF' });

      expect(roomService.endGame).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(broadcastSpy).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith('room:ended', { status: 'WAITING' });

      broadcastSpy.mockRestore();
    });

    it('error → emits room:error to client', async () => {
      roomService.endGame.mockResolvedValue({ error: '游戏尚未开始' });

      await gateway.handleEnd(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '游戏尚未开始',
      });
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleStart', () => {
    it('success → emits room:started to assignees and room:state', async () => {
      const mockAssignments = [
        { seatNo: 1, userId: 'user-2', role: '梅林', team: 'good' as const },
      ];
      roomService.startGame.mockResolvedValue({ assignments: mockAssignments });
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      mockServer.sockets.set('socket-1', mockClient);
      (gateway as any).userSocketMap.set('user-2', new Set(['socket-1']));

      await gateway.handleStart(mockClient, { roomCode: 'ABCDEF' });

      expect(roomService.startGame).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(mockClient.emit).toHaveBeenCalledWith('room:started', { yourRole: '梅林' });
      expect(mockServer.emit).toHaveBeenCalledWith('room:state', {
        room: mockRoom,
        players: mockPlayers,
      });
    });
  });
});
