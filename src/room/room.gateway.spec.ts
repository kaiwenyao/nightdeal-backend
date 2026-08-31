import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { RoomGateway } from './room.gateway';
import { RoomService, RoomInfo, PlayerInfo } from './room.service';
import { AuthService } from '../auth/auth.service';
import { GameType } from '../../prisma/generated/prisma/client.js';
import { RedisService } from '../redis/redis.service';

describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let roomService: jest.Mocked<RoomService>;
  let authService: jest.Mocked<AuthService>;
  let redisService: jest.Mocked<RedisService>;
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

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      except: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      fetchSockets: jest.fn().mockResolvedValue([]),
      socketsLeave: jest.fn(),
      socketsJoin: jest.fn(),
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
      cleanupOfflinePlayer: jest.fn(),
      markPlayerOnline: jest.fn(),
      markPlayerOffline: jest.fn(),
      updateRoomSettings: jest.fn(),
      kickPlayer: jest.fn(),
      startGame: jest.fn(),
      endGame: jest.fn(),
      getUserRooms: jest.fn(),
      updatePlayerInfo: jest.fn(),
      setEventsNotifier: jest.fn(),
    };

    const mockAuthService = {
      verifyToken: jest.fn(),
    };

    const mockRedisService = {
      incrWithExpireIfFirst: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomGateway,
        { provide: RoomService, useValue: mockRoomService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    gateway = module.get<RoomGateway>(RoomGateway);
    roomService = module.get(RoomService) as jest.Mocked<RoomService>;
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    redisService = module.get(RedisService) as jest.Mocked<RedisService>;

    // Inject mock server
    (gateway as any).server = mockServer;

    authService.verifyToken.mockResolvedValue('user-2');
    roomService.markPlayerOnline.mockResolvedValue(true);
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
      roomService.markPlayerOnline.mockResolvedValue(true);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.join).toHaveBeenCalledWith('ABCDEF');
      expect(roomService.markPlayerOnline).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(mockServer.emit).toHaveBeenCalledWith('room:state', expect.any(Object));
      expect(mockServer.emit).toHaveBeenCalledWith('room:reconnected', { userId: 'user-2' });
    });

    it('does not subscribe a stale member when timed cleanup wins reconnection', async () => {
      roomService.getRoom.mockResolvedValue({ ...mockRoom, status: 'PLAYING' });
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.isPlayerOffline.mockResolvedValue(true);
      roomService.markPlayerOnline.mockResolvedValue(false);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'GAME_ALREADY_STARTED',
        message: '游戏已开始，无法加入',
      });
      expect(mockServer.emit).not.toHaveBeenCalledWith('room:reconnected', expect.anything());
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
      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.except).toHaveBeenCalledWith('socket-1');
      expect(mockServer.emit).toHaveBeenCalledWith('room:player-joined', {
        player: newPlayer,
        playerCount: 2,
      });
    });
  });

  describe('handleLeave', () => {
    it('emits player-left and broadcasts room state', async () => {
      roomService.getPlayer
        .mockResolvedValueOnce(mockPlayers[0])
        .mockResolvedValue(null);
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(roomService.leaveRoom).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith('room:player-left', {
        userId: 'user-2',
        playerCount: 1,
      });
    });

    it('restores sockets when a fresh membership races delayed leave eviction', async () => {
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.notifyClientsAfterLeave('ABCDEF', 'user-2');

      expect(mockServer.socketsLeave).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.socketsJoin).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).not.toHaveBeenCalledWith('room:player-left', expect.anything());
    });

    it('emits offline rather than player-left when a PLAYING leave retains the player', async () => {
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.leaveRoom.mockResolvedValue('offline');

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(mockServer.emit).toHaveBeenCalledWith('room:offline', { userId: 'user-2' });
      expect(mockServer.emit).not.toHaveBeenCalledWith('room:player-left', expect.anything());
    });

    it('rejects leave from a non-member without touching the room', async () => {
      roomService.getPlayer.mockResolvedValue(null);

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '你不在该房间中',
      });
      expect(roomService.leaveRoom).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('stores rate limit state in Redis', async () => {
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(redisService.incrWithExpireIfFirst).toHaveBeenCalledWith('ws-rate:user:user-2', 1);
    });

    it('rejects socket events when the shared Redis rate limit is exceeded', async () => {
      redisService.incrWithExpireIfFirst.mockResolvedValueOnce(11);

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '请求过于频繁，请稍后再试',
      });
      expect(roomService.leaveRoom).not.toHaveBeenCalled();
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
        isRandomSeat: false,
      });

      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'room:settings-updated',
        expect.objectContaining({ maxPlayers: 8 }),
      );
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

  describe('notifyClientsAfterSettingsUpdate', () => {
    it('emits settings-updated then room:state', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      const broadcastSpy = jest.spyOn(gateway, 'broadcastRoomState').mockResolvedValue(null);

      await gateway.notifyClientsAfterSettingsUpdate('ABCDEF', 8, mockRoom.roleConfig, false);

      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith('room:settings-updated', {
        maxPlayers: 8,
        roleConfig: mockRoom.roleConfig,
        isRandomSeat: false,
      });
      expect(broadcastSpy).toHaveBeenCalledWith('ABCDEF');
    });
  });

  describe('handleEnd', () => {
    it('success → broadcasts room:state then room:ended', async () => {
      roomService.endGame.mockResolvedValue({ success: true });
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      const broadcastSpy = jest.spyOn(gateway, 'broadcastRoomState').mockResolvedValue(null);

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
      roomService.startGame.mockResolvedValue({
        assignments: mockAssignments,
        gameType: GameType.AVALON,
      });
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleStart(mockClient, { roomCode: 'ABCDEF' });

      expect(roomService.startGame).toHaveBeenCalledWith('ABCDEF', 'user-2');
      // room:state should be emitted BEFORE room:started (correct event ordering)
      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).toHaveBeenCalledWith('room:state', {
        room: mockRoom,
        players: mockPlayers,
      });
      expect(mockServer.to).toHaveBeenCalledWith('user:user-2');
      expect(mockServer.emit).toHaveBeenCalledWith('room:started', {
        yourRole: '梅林',
        gameType: 'AVALON',
      });
    });

    it('still delivers roles when the room:state broadcast cannot read the room', async () => {
      // Arrange: the start is already committed, but the follow-up room read
      // fails (transient DB error), so broadcastRoomState returns null.
      const mockAssignments = [
        { seatNo: 1, userId: 'user-2', role: '梅林', team: 'good' as const },
      ];
      roomService.startGame.mockResolvedValue({
        assignments: mockAssignments,
        gameType: GameType.AVALON,
      });
      roomService.getRoom.mockResolvedValue(null);

      // Act
      await gateway.handleStart(mockClient, { roomCode: 'ABCDEF' });

      // Assert: roles still go out, with gameType from startGame's transaction.
      expect(mockServer.to).toHaveBeenCalledWith('user:user-2');
      expect(mockServer.emit).toHaveBeenCalledWith('room:started', {
        yourRole: '梅林',
        gameType: 'AVALON',
      });
      expect(mockServer.emit).not.toHaveBeenCalledWith('room:state', expect.anything());
    });

    it('still delivers roles when the room:state broadcast throws', async () => {
      const mockAssignments = [
        { seatNo: 1, userId: 'user-2', role: '梅林', team: 'good' as const },
      ];
      roomService.startGame.mockResolvedValue({
        assignments: mockAssignments,
        gameType: GameType.AVALON,
      });
      roomService.getRoom.mockRejectedValue(new Error('db timeout'));

      await gateway.handleStart(mockClient, { roomCode: 'ABCDEF' });

      expect(mockServer.to).toHaveBeenCalledWith('user:user-2');
      expect(mockServer.emit).toHaveBeenCalledWith('room:started', {
        yourRole: '梅林',
        gameType: 'AVALON',
      });
    });
  });

  describe('handleDisconnect', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('marks the player offline when no connections remain anywhere', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockResolvedValue(['ABCDEF']);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleDisconnect(mockClient);

      expect(mockServer.in).toHaveBeenCalledWith('user:user-2');
      expect(roomService.markPlayerOffline).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(mockServer.emit).toHaveBeenCalledWith('room:offline', { userId: 'user-2' });
    });

    it('does not remove a player who reconnects before the cleanup timer fires', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockResolvedValue(['ABCDEF']);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      roomService.cleanupOfflinePlayer.mockResolvedValue('skipped');

      await gateway.handleDisconnect(mockClient);
      await jest.runAllTimersAsync();

      expect(roomService.cleanupOfflinePlayer).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(mockServer.emit).not.toHaveBeenCalledWith('room:player-left', expect.anything());
    });

    it('does not emit player-left when the room starts before timed cleanup', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockResolvedValue(['ABCDEF']);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      roomService.cleanupOfflinePlayer.mockResolvedValue('offline');

      await gateway.handleDisconnect(mockClient);
      await jest.runAllTimersAsync();

      expect(mockServer.emit).toHaveBeenCalledWith('room:offline', { userId: 'user-2' });
      expect(mockServer.emit).not.toHaveBeenCalledWith('room:player-left', expect.anything());
    });

    it('keeps exactly one cleanup timer for duplicate final-disconnect handling', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockResolvedValue(['ABCDEF']);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleDisconnect(mockClient);
      await gateway.handleDisconnect(mockClient);

      expect(jest.getTimerCount()).toBe(1);
    });

    it('does nothing while the user still has live connections on any instance', async () => {
      mockServer.fetchSockets.mockResolvedValue([{ id: 'socket-9' }] as any);

      await gateway.handleDisconnect(mockClient);

      expect(roomService.getUserRooms).not.toHaveBeenCalled();
      expect(roomService.markPlayerOffline).not.toHaveBeenCalled();
    });

    it('swallows and logs errors instead of crashing the process', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockRejectedValue(new Error('db down'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(gateway.handleDisconnect(mockClient)).resolves.toBeUndefined();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error handling disconnect'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });

    it('returns early when the socket never completed authentication', async () => {
      (mockClient as any).data = {};

      await gateway.handleDisconnect(mockClient);

      expect(mockServer.in).not.toHaveBeenCalled();
      expect(roomService.getUserRooms).not.toHaveBeenCalled();
    });

    it('broadcasts a final player-left when the cleanup timer removes the player', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockResolvedValue(['ABCDEF']);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      roomService.getPlayer.mockResolvedValue(null);
      roomService.getPlayerCount.mockResolvedValue(0);
      roomService.cleanupOfflinePlayer.mockResolvedValue('removed');

      await gateway.handleDisconnect(mockClient);
      await jest.runAllTimersAsync();

      expect(roomService.cleanupOfflinePlayer).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(mockServer.emit).toHaveBeenCalledWith('room:player-left', {
        userId: 'user-2',
        playerCount: 0,
      });
    });

    it('logs and swallows errors thrown inside the cleanup timer', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockResolvedValue(['ABCDEF']);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      roomService.cleanupOfflinePlayer.mockRejectedValue(new Error('cleanup boom'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await gateway.handleDisconnect(mockClient);
      await jest.runAllTimersAsync();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error cleaning up offline player user-2 from room ABCDEF'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });

    it('keeps one cleanup timer per room for a user disconnected from several rooms', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockResolvedValue(['ABCDEF', 'XYZXYZ']);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      roomService.cleanupOfflinePlayer.mockResolvedValue('skipped');

      await gateway.handleDisconnect(mockClient);
      await gateway.handleDisconnect(mockClient);

      expect(jest.getTimerCount()).toBe(2);
      expect(mockServer.emit).toHaveBeenCalledWith('room:offline', { userId: 'user-2' });

      await jest.runAllTimersAsync();

      expect(roomService.cleanupOfflinePlayer).toHaveBeenCalledWith('ABCDEF', 'user-2');
      expect(roomService.cleanupOfflinePlayer).toHaveBeenCalledWith('XYZXYZ', 'user-2');
    });

    it('leaves another room cleanup timer untouched when a rejoin misses the map', async () => {
      mockServer.fetchSockets.mockResolvedValue([]);
      roomService.getUserRooms.mockResolvedValue(['ABCDEF']);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleDisconnect(mockClient);

      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.isPlayerOffline.mockResolvedValue(true);
      roomService.markPlayerOnline.mockResolvedValue(true);

      await gateway.handleJoin(mockClient, { roomCode: 'XYZXYZ' });

      expect(jest.getTimerCount()).toBe(1);
      expect(mockClient.join).toHaveBeenCalledWith('XYZXYZ');
    });
  });

  describe('onModuleInit', () => {
    it('registers itself as the room service events notifier', () => {
      gateway.onModuleInit();

      expect(roomService.setEventsNotifier).toHaveBeenCalledWith(gateway);
    });
  });

  describe('handleConnection', () => {
    it('authenticates via the handshake token, tags the socket and joins the per-user room', async () => {
      await gateway.handleConnection(mockClient);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockClient.data.userId).toBe('user-2');
      expect(mockClient.join).toHaveBeenCalledWith('user:user-2');
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it('falls back to a Bearer Authorization header token', async () => {
      (mockClient as any).handshake = { auth: {}, headers: { authorization: 'Bearer header-token' } };

      await gateway.handleConnection(mockClient);

      expect(authService.verifyToken).toHaveBeenCalledWith('header-token');
      expect(mockClient.join).toHaveBeenCalledWith('user:user-2');
    });

    it('accepts a raw Authorization header when handshake.auth is absent', async () => {
      (mockClient as any).handshake = { headers: { authorization: 'raw-token' } };

      await gateway.handleConnection(mockClient);

      expect(authService.verifyToken).toHaveBeenCalledWith('raw-token');
    });

    it('ignores a blank auth token and uses the header instead', async () => {
      (mockClient as any).handshake = {
        auth: { token: '   ' },
        headers: { authorization: 'Bearer header-token' },
      };

      await gateway.handleConnection(mockClient);

      expect(authService.verifyToken).toHaveBeenCalledWith('header-token');
    });

    it('disconnects with UNAUTHORIZED when no token is present anywhere', async () => {
      (mockClient as any).handshake = { auth: {} };

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'UNAUTHORIZED',
        message: '未登录',
      });
      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockClient.join).not.toHaveBeenCalled();
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('disconnects when token verification throws', async () => {
      authService.verifyToken.mockRejectedValueOnce(new Error('malformed token'));

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'UNAUTHORIZED',
        message: '认证失败',
      });
      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it('disconnects when the token resolves to no user', async () => {
      authService.verifyToken.mockResolvedValueOnce(null as any);

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'UNAUTHORIZED',
        message: '登录态失效',
      });
      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockClient.join).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('rejects every room message type while the rate limit is exceeded', async () => {
      redisService.incrWithExpireIfFirst.mockResolvedValue(11);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });
      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });
      await gateway.handleKick(mockClient, { roomCode: 'ABCDEF', targetUserId: 'user-3' });
      await gateway.handleStart(mockClient, { roomCode: 'ABCDEF' });
      await gateway.handleEnd(mockClient, { roomCode: 'ABCDEF' });
      await gateway.handleSettingsUpdate(mockClient, { roomCode: 'ABCDEF' });
      await gateway.handlePlayerUpdate(mockClient, { nickName: '新昵称' });

      expect(mockClient.emit).toHaveBeenCalledTimes(7);
      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '请求过于频繁，请稍后再试',
      });
      expect(roomService.getRoom).not.toHaveBeenCalled();
      expect(roomService.leaveRoom).not.toHaveBeenCalled();
      expect(roomService.kickPlayer).not.toHaveBeenCalled();
      expect(roomService.startGame).not.toHaveBeenCalled();
      expect(roomService.endGame).not.toHaveBeenCalled();
      expect(roomService.updateRoomSettings).not.toHaveBeenCalled();
      expect(roomService.updatePlayerInfo).not.toHaveBeenCalled();
    });

    it('keys the rate limit by socket id when the socket has no user id', async () => {
      (mockClient as any).data = {};
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(redisService.incrWithExpireIfFirst).toHaveBeenCalledWith('ws-rate:socket:socket-1', 1);
    });

    it('treats a Redis failure as rate-limited instead of opening the floodgates', async () => {
      redisService.incrWithExpireIfFirst.mockRejectedValueOnce(new Error('redis down'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '请求过于频繁，请稍后再试',
      });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to check WebSocket rate limit for user:user-2'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });
  });

  describe('handleJoin - rejection paths', () => {
    it('emits ROOM_NOT_FOUND when the room does not exist', async () => {
      roomService.getRoom.mockResolvedValue(null);

      await gateway.handleJoin(mockClient, { roomCode: 'NOTFOUND' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_NOT_FOUND',
        message: '房间不存在',
      });
      expect(roomService.joinRoom).not.toHaveBeenCalled();
    });

    it('leaves the socket and asks for a rejoin when membership vanished after confirmation', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer
        .mockResolvedValueOnce(mockPlayers[0])
        .mockResolvedValue(null);
      roomService.isPlayerOffline.mockResolvedValue(false);
      roomService.markPlayerOnline.mockResolvedValue(true);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.join).toHaveBeenCalledWith('ABCDEF');
      expect(mockClient.leave).toHaveBeenCalledWith('ABCDEF');
      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '房间成员状态已变更，请重新加入',
      });
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('delivers the role to a reconnecting member once the game is playing', async () => {
      const playingMember: PlayerInfo = { ...mockPlayers[0], role: '梅林' };
      roomService.getRoom.mockResolvedValue({ ...mockRoom, status: 'PLAYING' });
      roomService.getPlayer.mockResolvedValue(playingMember);
      roomService.isPlayerOffline.mockResolvedValue(false);
      roomService.markPlayerOnline.mockResolvedValue(true);
      roomService.getPlayers.mockResolvedValue([playingMember]);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:started', {
        yourRole: '梅林',
        gameType: 'AVALON',
      });
    });

    it('emits ROOM_NOT_FOUND when the room disappears after a lost presence race', async () => {
      roomService.getRoom
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce(null);
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.isPlayerOffline.mockResolvedValue(true);
      roomService.markPlayerOnline.mockResolvedValue(false);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_NOT_FOUND',
        message: '房间不存在',
      });
      expect(roomService.joinRoom).not.toHaveBeenCalled();
    });

    it('emits ROOM_FULL when the room has no free seats', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(null);
      roomService.getPlayerCount.mockResolvedValue(mockRoom.maxPlayers);

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_FULL',
        message: '房间已满',
      });
      expect(roomService.joinRoom).not.toHaveBeenCalled();
    });

    it('forwards joinRoom service errors to the client', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayer.mockResolvedValue(null);
      roomService.getPlayerCount.mockResolvedValue(1);
      roomService.joinRoom.mockResolvedValue({ error: '座位分配失败，请重试' });

      await gateway.handleJoin(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '座位分配失败，请重试',
      });
    });
  });

  describe('notifyClientsAfterJoin', () => {
    it('emits player-joined to the whole room when no socket is excluded', async () => {
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.notifyClientsAfterJoin('ABCDEF', mockPlayers[0], 1);

      expect(mockServer.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.except).not.toHaveBeenCalled();
      expect(mockServer.emit).toHaveBeenCalledWith('room:player-joined', {
        player: mockPlayers[0],
        playerCount: 1,
      });
    });
  });

  describe('notifyClientsAfterKick', () => {
    it('broadcasts state instead of player-left when the kicked player concurrently re-joined', async () => {
      roomService.kickPlayer.mockResolvedValue({ success: true });
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);

      await gateway.handleKick(mockClient, {
        roomCode: 'ABCDEF',
        targetUserId: 'user-3',
      });

      expect(mockServer.emit).toHaveBeenCalledWith('room:error', {
        code: 'KICKED',
        message: '你已被房主踢出房间',
      });
      expect(mockServer.socketsLeave).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.socketsJoin).toHaveBeenCalledWith('ABCDEF');
      expect(mockServer.emit).not.toHaveBeenCalledWith('room:player-left', expect.anything());
    });
  });

  describe('handleLeave - not_found outcome', () => {
    it('emits an error when the leave outcome is not_found', async () => {
      roomService.getPlayer.mockResolvedValue(mockPlayers[0]);
      roomService.leaveRoom.mockResolvedValue('not_found');

      await gateway.handleLeave(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '你不在该房间中',
      });
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleKick - error path', () => {
    it('forwards kickPlayer service errors to the client', async () => {
      roomService.kickPlayer.mockResolvedValue({ error: '仅房主可以踢人' });

      await gateway.handleKick(mockClient, {
        roomCode: 'ABCDEF',
        targetUserId: 'user-3',
      });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '仅房主可以踢人',
      });
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleStart - error path', () => {
    it('forwards startGame service errors to the client', async () => {
      roomService.startGame.mockResolvedValue({ error: '仅房主可以开始游戏' });

      await gateway.handleStart(mockClient, { roomCode: 'ABCDEF' });

      expect(mockClient.emit).toHaveBeenCalledWith('room:error', {
        code: 'ROOM_ERROR',
        message: '仅房主可以开始游戏',
      });
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('handlePlayerUpdate', () => {
    it('broadcasts player:updated to every room the user belongs to', async () => {
      roomService.getUserRooms.mockResolvedValue(['ABCDEF', 'XYZXYZ']);

      await gateway.handlePlayerUpdate(mockClient, {
        nickName: '新昵称',
        avatarUrl: 'https://example.com/new.png',
      });

      expect(roomService.updatePlayerInfo).toHaveBeenCalledWith('user-2', {
        nickName: '新昵称',
        avatarUrl: 'https://example.com/new.png',
      });
      expect(mockClient.to).toHaveBeenCalledWith('ABCDEF');
      expect(mockClient.to).toHaveBeenCalledWith('XYZXYZ');
      expect(mockClient.emit).toHaveBeenCalledWith('player:updated', {
        userId: 'user-2',
        nickName: '新昵称',
        avatarUrl: 'https://example.com/new.png',
      });
    });
  });

  describe('notifyClientsAfterSettingsUpdate', () => {
    it('omits isRandomSeat from the payload when it is not provided', async () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcastRoomState').mockResolvedValue(null);

      await gateway.notifyClientsAfterSettingsUpdate('ABCDEF', 6, mockRoom.roleConfig);

      expect(mockServer.emit).toHaveBeenCalledWith('room:settings-updated', {
        maxPlayers: 6,
        roleConfig: mockRoom.roleConfig,
      });
      broadcastSpy.mockRestore();
    });
  });

  describe('broadcastRoomState - adapter edge cases', () => {
    it('reports zero clients when the adapter has no room entry', async () => {
      (gateway as any).server.adapter.rooms = undefined;
      roomService.getRoom.mockResolvedValue(mockRoom);
      roomService.getPlayers.mockResolvedValue(mockPlayers);
      const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

      await gateway.broadcastRoomState('ABCDEF');

      expect(mockServer.emit).toHaveBeenCalledWith('room:state', {
        room: mockRoom,
        players: mockPlayers,
      });
      debugSpy.mockRestore();
    });
  });
});
