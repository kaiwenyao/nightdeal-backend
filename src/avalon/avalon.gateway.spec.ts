/**
 * 阿瓦隆游戏 WebSocket 网关单元测试
 * 直接实例化网关并注入 mock 依赖
 */

import { AvalonGateway } from './avalon.gateway';
import { AvalonService } from './avalon.service';
import { RoomService } from '../room/room.service';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../redis/redis.service';
import { WsErrorCode } from '../common/constants/ws-error-codes';
import { AvalonGameState, DEFAULT_AVALON_CONFIG } from './types';

describe('AvalonGateway', () => {
  let gateway: AvalonGateway;

  const mockAvalonService = {
    getGameState: jest.fn(),
    getPlayerView: jest.fn(),
    getAllPlayerViews: jest.fn(),
    beginGame: jest.fn(),
    updateHost: jest.fn(),
    markPlayerOnline: jest.fn(),
    markPlayerOffline: jest.fn(),
  };

  const mockRoomService = {
    getRoom: jest.fn(),
    getPlayer: jest.fn(),
    setAvalonGameInitializer: jest.fn(),
  };

  const mockAuthService = {
    verifyToken: jest.fn(),
  };

  const mockRedis = {
    incrWithExpireIfFirst: jest.fn().mockResolvedValue(1),
  };

  const roomEmit = jest.fn();
  const mockServer = {
    to: jest.fn().mockReturnValue({ emit: roomEmit }),
    in: jest.fn().mockReturnValue({
      fetchSockets: jest.fn().mockResolvedValue([]),
    }),
  };

  function buildState(playerIds: string[]): AvalonGameState {
    return {
      roomId: 'ABC123',
      phase: 'role_reveal',
      players: playerIds.map((id, i) => ({
        id,
        name: `P${i + 1}`,
        seatNo: i + 1,
        isHost: i === 0,
        isConnected: true,
        role: 'Merlin' as const,
        faction: 'good' as const,
      })),
      config: DEFAULT_AVALON_CONFIG,
      leaderIndex: 0,
      round: 1,
      rejectedTeamVoteCount: 0,
      proposedTeam: [],
      teamVotes: {},
      questActions: {},
      questHistory: [],
      goodScore: 0,
      evilScore: 0,
    };
  }

  function buildClient(userId: string) {
    return {
      id: 'sock-1',
      data: { userId, avalonRooms: [] as string[] },
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.incrWithExpireIfFirst.mockResolvedValue(1);
    mockRoomService.getRoom.mockResolvedValue({ gameType: 'AVALON', status: 'PLAYING', hostId: 'u1' });
    gateway = new AvalonGateway(
      mockAvalonService as unknown as AvalonService,
      mockRoomService as unknown as RoomService,
      mockAuthService as unknown as AuthService,
      mockRedis as unknown as RedisService,
    );
    gateway.server = mockServer as never;
  });

  describe('handleJoinGame', () => {
    it('rejects when user is not in the room', async () => {
      mockRoomService.getPlayer.mockResolvedValue(null);
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '你不在这个房间中',
      });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('rejects when the database room is no longer PLAYING even if stale state exists', async () => {
      mockRoomService.getRoom.mockResolvedValue({ gameType: 'AVALON', status: 'WAITING' });
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '游戏尚未开始',
      });
      expect(mockAvalonService.getGameState).not.toHaveBeenCalled();
    });

    it('rejects when game has not started', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
      mockAvalonService.getGameState.mockResolvedValue(null);
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '游戏尚未开始',
      });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('rejects when user is not a player in the game state', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u9' });
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));
      const client = buildClient('u9');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '你不在本局游戏中',
      });
      expect(client.join).not.toHaveBeenCalled();
      // 不能让 getPlayerView 抛异常
      expect(mockAvalonService.getPlayerView).not.toHaveBeenCalled();
    });

    it('joins the socket room, marks online and sends state for a valid player', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));
      mockAvalonService.getPlayerView.mockResolvedValue({ myId: 'u1', phase: 'role_reveal' });
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.join).toHaveBeenCalledWith('avalon:ABC123');
      expect(client.join).toHaveBeenCalledWith('avalon:ABC123:user:u1');
      expect(client.data.avalonRooms).toEqual(['ABC123']);
      expect(mockAvalonService.markPlayerOnline).toHaveBeenCalledWith('ABC123', 'u1');
      expect(client.emit).toHaveBeenCalledWith('avalon:state', { myId: 'u1', phase: 'role_reveal' });
    });

    it('leaves previously joined avalon rooms when joining another one', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));
      mockAvalonService.getPlayerView.mockResolvedValue({ myId: 'u1' });
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');
      client.data.avalonRooms = ['OLD999'];

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.leave).toHaveBeenCalledWith('avalon:OLD999');
      expect(client.data.avalonRooms).toEqual(['ABC123']);
      expect(mockAvalonService.markPlayerOffline).toHaveBeenCalledWith('OLD999', 'u1');
    });
  });

  describe('handleBegin', () => {
    it('broadcasts state and phase-changed on success', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
      mockAvalonService.beginGame.mockResolvedValue({ success: true, phase: 'team_building', round: 1 });
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(mockAvalonService.beginGame).toHaveBeenCalledWith('ABC123', 'u1');
      expect(mockServer.to).toHaveBeenCalledWith('avalon:ABC123');
      expect(roomEmit).toHaveBeenCalledWith('avalon:phase-changed', {
        phase: 'team_building',
        round: 1,
      });
    });

    it('uses the current database host and synchronizes cached host state', async () => {
      mockRoomService.getRoom.mockResolvedValue({ gameType: 'AVALON', status: 'PLAYING', hostId: 'u2' });
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u2' });
      mockAvalonService.beginGame.mockResolvedValue({ success: true, phase: 'team_building', round: 1 });
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u2');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(mockAvalonService.updateHost).toHaveBeenCalledWith('ABC123', 'u2');
      expect(mockAvalonService.beginGame).toHaveBeenCalledWith('ABC123', 'u2');
    });

    it('emits avalon:error when service rejects (e.g. non-host or wrong phase)', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u2' });
      mockAvalonService.beginGame.mockResolvedValue({ error: '仅房主可以开始任务阶段' });
      const client = buildClient('u2');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '仅房主可以开始任务阶段',
      });
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('rejects begin from a player who is not in the room', async () => {
      mockRoomService.getPlayer.mockResolvedValue(null);
      const client = buildClient('u1');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(mockAvalonService.beginGame).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '你不在这个房间中',
      });
    });
  });

  describe('handleLeaveGame', () => {
    it('marks the player offline and broadcasts when no other sockets remain', async () => {
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');
      client.data.avalonRooms = ['ABC123'];

      await gateway.handleLeaveGame(client as never, { roomCode: 'ABC123' });

      expect(client.leave).toHaveBeenCalledWith('avalon:ABC123');
      expect(client.data.avalonRooms).toEqual([]);
      expect(mockAvalonService.markPlayerOffline).toHaveBeenCalledWith('ABC123', 'u1');
    });

    it('does not mark offline when another socket for the user is still in the room', async () => {
      mockServer.in.mockReturnValueOnce({
        fetchSockets: jest.fn().mockResolvedValue([{ id: 'other-sock', data: { userId: 'u1' } }]),
      });
      const client = buildClient('u1');
      client.data.avalonRooms = ['ABC123'];

      await gateway.handleLeaveGame(client as never, { roomCode: 'ABC123' });

      expect(mockAvalonService.markPlayerOffline).not.toHaveBeenCalled();
    });
  });

  describe('broadcastGameState', () => {
    it('targets only room-scoped private channels', async () => {
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map([
        ['u1', { myId: 'u1' }],
      ]));

      await gateway.broadcastGameState('ABC123');

      expect(mockServer.to).toHaveBeenCalledWith('avalon:ABC123:user:u1');
      expect(mockServer.to).not.toHaveBeenCalledWith('user:u1');
    });
  });

  describe('handleDisconnect', () => {
    it('leaves joined avalon rooms and marks the player offline', async () => {
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');
      client.data.avalonRooms = ['ABC123'];

      await gateway.handleDisconnect(client as never);

      expect(client.leave).toHaveBeenCalledWith('avalon:ABC123');
      expect(client.data.avalonRooms).toEqual([]);
      expect(mockAvalonService.markPlayerOffline).toHaveBeenCalledWith('ABC123', 'u1');
    });

    it('does not mark offline when another socket for the user is still in the same room', async () => {
      mockServer.in.mockReturnValueOnce({
        fetchSockets: jest.fn().mockResolvedValue([{ id: 'other-sock', data: { userId: 'u1' } }]),
      });
      const client = buildClient('u1');
      client.data.avalonRooms = ['ABC123'];

      await gateway.handleDisconnect(client as never);

      expect(mockAvalonService.markPlayerOffline).not.toHaveBeenCalled();
    });
  });
});
