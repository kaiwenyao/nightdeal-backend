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
    submitTeamVote: jest.fn(),
    isTeamVoteComplete: jest.fn(),
    resolveTeamVote: jest.fn(),
    setGenerationValidator: jest.fn(),
    // 以下为追加的覆盖测试所需方法（原有用例不使用）
    proposeTeam: jest.fn(),
    submitQuestAction: jest.fn(),
    isQuestComplete: jest.fn(),
    resolveQuest: jest.fn(),
    assassinate: jest.fn(),
  };

  const mockRoomService = {
    getRoom: jest.fn(),
    getPlayer: jest.fn(),
    isActiveGameGeneration: jest.fn(),
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

  describe('handleTeamVote', () => {
    beforeEach(() => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
    });

    it('emits avalon:game-finished instead of team_building when the 5th rejection ends the game', async () => {
      // 第 5 次否决后引擎判负：state 已是 finished，绝不能再广播回 team_building
      const finishedState = {
        ...buildState(['u1', 'u2', 'u3', 'u4', 'u5']),
        phase: 'finished' as const,
        rejectedTeamVoteCount: 5,
        winner: 'evil' as const,
        resultReason: 'five_rejected_teams' as const,
      };
      mockAvalonService.submitTeamVote.mockResolvedValue({ success: true });
      mockAvalonService.isTeamVoteComplete.mockResolvedValue(true);
      mockAvalonService.resolveTeamVote.mockResolvedValue({
        result: {
          approved: false,
          approvals: 0,
          rejections: 5,
          votes: {},
          rejectedCount: 5,
        },
        views: new Map(),
      });
      // handleVoteComplete 重新读取状态以决定公开/匿名投票展示
      mockAvalonService.getGameState.mockResolvedValue(finishedState);
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'reject' });

      // 终局：广播 game-finished，且绝不能广播回 team_building
      expect(roomEmit).toHaveBeenCalledWith('avalon:game-finished', {
        winner: 'evil',
        reason: 'five_rejected_teams',
      });
      const phaseChangedCalls = roomEmit.mock.calls.filter(
        (call) => call[0] === 'avalon:phase-changed',
      );
      expect(phaseChangedCalls).toEqual([]);
    });

    it('broadcasts phase-changed team_building on a normal rejection (not terminal)', async () => {
      const teamBuildingState = {
        ...buildState(['u1', 'u2', 'u3', 'u4', 'u5']),
        phase: 'team_building' as const,
        rejectedTeamVoteCount: 1,
      };
      mockAvalonService.submitTeamVote.mockResolvedValue({ success: true });
      mockAvalonService.isTeamVoteComplete.mockResolvedValue(true);
      mockAvalonService.resolveTeamVote.mockResolvedValue({
        result: {
          approved: false,
          approvals: 2,
          rejections: 3,
          votes: {},
          rejectedCount: 1,
        },
        views: new Map(),
      });
      mockAvalonService.getGameState.mockResolvedValue(teamBuildingState);
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'reject' });

      expect(roomEmit).toHaveBeenCalledWith('avalon:phase-changed', {
        phase: 'team_building',
        rejectedCount: 1,
      });
      expect(roomEmit).not.toHaveBeenCalledWith('avalon:game-finished', expect.anything());
    });

    it('broadcasts phase-changed quest_action when the team is approved', async () => {
      const questActionState = {
        ...buildState(['u1', 'u2', 'u3', 'u4', 'u5']),
        phase: 'quest_action' as const,
      };
      mockAvalonService.submitTeamVote.mockResolvedValue({ success: true });
      mockAvalonService.isTeamVoteComplete.mockResolvedValue(true);
      mockAvalonService.resolveTeamVote.mockResolvedValue({
        result: {
          approved: true,
          approvals: 3,
          rejections: 2,
          votes: {},
          rejectedCount: 0,
        },
        views: new Map(),
      });
      mockAvalonService.getGameState.mockResolvedValue(questActionState);
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'approve' });

      expect(roomEmit).toHaveBeenCalledWith('avalon:phase-changed', {
        phase: 'quest_action',
      });
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

  // ==================== 以下为追加的覆盖率测试（不影响以上原有用例） ====================

  describe('onModuleInit', () => {
    it('registers the game initializer and generation validator with RoomService', async () => {
      mockRoomService.isActiveGameGeneration.mockResolvedValue(true);
      gateway.onModuleInit();

      expect(mockRoomService.setAvalonGameInitializer).toHaveBeenCalledTimes(1);
      expect(mockRoomService.setAvalonGameInitializer).toHaveBeenCalledWith(mockAvalonService);

      expect(mockAvalonService.setGenerationValidator).toHaveBeenCalledTimes(1);
      const validator = mockAvalonService.setGenerationValidator.mock
        .calls[0][0] as (roomCode: string, generationId: string) => Promise<boolean>;
      await expect(validator('ABC123', 'gen-1')).resolves.toBe(true);
      expect(mockRoomService.isActiveGameGeneration).toHaveBeenCalledWith('ABC123', 'gen-1');
    });
  });

  describe('handleConnection', () => {
    function buildConnectingClient(handshake: Record<string, unknown> = {}) {
      return {
        id: 'sock-conn',
        data: {} as { userId?: string },
        handshake,
        emit: jest.fn(),
        join: jest.fn(),
        disconnect: jest.fn(),
      };
    }

    it('handles a handshake without an auth field', async () => {
      const client = buildConnectingClient({ headers: {} });

      await gateway.handleConnection(client as never);

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.UNAUTHORIZED,
        message: '未登录',
      });
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('disconnects sockets without any token', async () => {
      const client = buildConnectingClient({ auth: {}, headers: {} });

      await gateway.handleConnection(client as never);

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.UNAUTHORIZED,
        message: '未登录',
      });
      expect(client.disconnect).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('disconnects when verifyToken throws', async () => {
      mockAuthService.verifyToken.mockRejectedValueOnce(new Error('bad token'));
      const client = buildConnectingClient({ auth: { token: 'tok' } });

      await gateway.handleConnection(client as never);

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.UNAUTHORIZED,
        message: '认证失败',
      });
      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('disconnects when verifyToken reports an expired session', async () => {
      mockAuthService.verifyToken.mockResolvedValueOnce(null);
      const client = buildConnectingClient({ auth: { token: 'tok' } });

      await gateway.handleConnection(client as never);

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.UNAUTHORIZED,
        message: '登录态失效',
      });
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('authenticates via handshake.auth.token and joins the user channel', async () => {
      mockAuthService.verifyToken.mockResolvedValueOnce('u1');
      const client = buildConnectingClient({ auth: { token: 'tok' } });

      await gateway.handleConnection(client as never);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('tok');
      expect(client.data.userId).toBe('u1');
      expect(client.join).toHaveBeenCalledWith('user:u1');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('falls back to the Authorization header with a Bearer prefix', async () => {
      mockAuthService.verifyToken.mockResolvedValueOnce('u2');
      const client = buildConnectingClient({ auth: {}, headers: { authorization: 'Bearer hdr-tok' } });

      await gateway.handleConnection(client as never);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('hdr-tok');
      expect(client.data.userId).toBe('u2');
      expect(client.join).toHaveBeenCalledWith('user:u2');
    });

    it('falls back to a bare Authorization header without a Bearer prefix', async () => {
      mockAuthService.verifyToken.mockResolvedValueOnce('u3');
      const client = buildConnectingClient({ auth: {}, headers: { authorization: 'hdr-tok' } });

      await gateway.handleConnection(client as never);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('hdr-tok');
      expect(client.data.userId).toBe('u3');
    });

    it('ignores a blank auth.token and uses the header token instead', async () => {
      mockAuthService.verifyToken.mockResolvedValueOnce('u4');
      const client = buildConnectingClient({
        auth: { token: '   ' },
        headers: { authorization: 'Bearer real-tok' },
      });

      await gateway.handleConnection(client as never);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('real-tok');
    });
  });

  describe('handleDisconnect (edge cases)', () => {
    it('returns early when the socket never joined a user', async () => {
      const client = { id: 'sock-anon', data: {}, leave: jest.fn(), emit: jest.fn() };

      await gateway.handleDisconnect(client as never);

      expect(client.leave).not.toHaveBeenCalled();
      expect(mockAvalonService.markPlayerOffline).not.toHaveBeenCalled();
    });

    it('defaults to an empty room list when the socket never subscribed (disconnect)', async () => {
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = {
        id: 'sock-1',
        data: { userId: 'u1' } as { userId?: string; avalonRooms?: string[] },
        emit: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      };

      await gateway.handleDisconnect(client as never);

      expect(client.leave).not.toHaveBeenCalled();
      expect(client.data.avalonRooms).toEqual([]);
      expect(mockAvalonService.markPlayerOffline).not.toHaveBeenCalled();
    });

    it('swallows unexpected errors from the disconnect lifecycle', async () => {
      const client = buildClient('u1');
      client.data.avalonRooms = ['ABC123'];
      client.leave.mockImplementation(() => {
        throw new Error('boom');
      });

      await expect(gateway.handleDisconnect(client as never)).resolves.toBeUndefined();
      expect(mockAvalonService.markPlayerOffline).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('rejects every command when the redis rate-limit check itself fails', async () => {
      mockRedis.incrWithExpireIfFirst.mockRejectedValue(new Error('redis down'));
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });
      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });
      await gateway.handleProposeTeam(client as never, { roomCode: 'ABC123', selectedPlayerIds: ['u1'] });
      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'approve' });
      await gateway.handleQuestAction(client as never, { roomCode: 'ABC123', action: 'success' });
      await gateway.handleAssassinate(client as never, { roomCode: 'ABC123', targetPlayerId: 'u1' });

      expect(client.emit).toHaveBeenCalledTimes(6);
      for (let i = 1; i <= 6; i++) {
        expect(client.emit).toHaveBeenNthCalledWith(i, 'avalon:error', {
          code: WsErrorCode.ROOM_ERROR,
          message: '请求过于频繁',
        });
      }
      expect(mockAvalonService.beginGame).not.toHaveBeenCalled();
      expect(mockAvalonService.proposeTeam).not.toHaveBeenCalled();
      expect(mockAvalonService.submitTeamVote).not.toHaveBeenCalled();
      expect(mockAvalonService.submitQuestAction).not.toHaveBeenCalled();
      expect(mockAvalonService.assassinate).not.toHaveBeenCalled();
    });

    it('rejects commands once the per-user counter exceeds the burst limit', async () => {
      mockRedis.incrWithExpireIfFirst.mockResolvedValue(11);
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(mockRedis.incrWithExpireIfFirst).toHaveBeenCalledWith('ws-avalon-rate:user:u1', 1);
      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '请求过于频繁',
      });
      expect(mockRoomService.getRoom).not.toHaveBeenCalled();
    });

    it('rate-limits by socket id when the user is unknown', async () => {
      mockRedis.incrWithExpireIfFirst.mockResolvedValue(11);
      const client = { id: 'sock-anon', data: {}, emit: jest.fn(), join: jest.fn(), leave: jest.fn() };

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(mockRedis.incrWithExpireIfFirst).toHaveBeenCalledWith('ws-avalon-rate:socket:sock-anon', 1);
      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '请求过于频繁',
      });
    });
  });

  describe('requireActiveMember guards', () => {
    it('emits 房间不存在 when the room is missing', async () => {
      mockRoomService.getRoom.mockResolvedValue(null);
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '房间不存在',
      });
      expect(mockAvalonService.getGameState).not.toHaveBeenCalled();
    });

    it('emits 房间不存在 when the room is not an avalon room', async () => {
      mockRoomService.getRoom.mockResolvedValue({ gameType: 'SGS', status: 'PLAYING' });
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '房间不存在',
      });
      expect(mockAvalonService.getGameState).not.toHaveBeenCalled();
    });
  });

  describe('handleJoinGame (edge cases)', () => {
    beforeEach(() => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
    });

    it('emits join failure without joining when the state lookup throws', async () => {
      mockAvalonService.getGameState.mockRejectedValue(new Error('redis boom'));
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '加入游戏失败，请重试',
      });
      expect(client.join).not.toHaveBeenCalled();
      expect(mockAvalonService.markPlayerOnline).not.toHaveBeenCalled();
    });

    it('skips sending state when the player view is unavailable', async () => {
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));
      mockAvalonService.getPlayerView.mockResolvedValue(null);
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.join).toHaveBeenCalledWith('avalon:ABC123');
      expect(mockAvalonService.markPlayerOnline).toHaveBeenCalledWith('ABC123', 'u1');
      expect(client.emit).not.toHaveBeenCalledWith('avalon:state', expect.anything());
    });

    it('does not fail the join when the follow-up broadcast throws', async () => {
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));
      mockAvalonService.getPlayerView.mockResolvedValue({ myId: 'u1' });
      mockAvalonService.getAllPlayerViews.mockRejectedValueOnce(new Error('broadcast boom'));
      const client = buildClient('u1');

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.join).toHaveBeenCalledWith('avalon:ABC123');
      expect(client.emit).toHaveBeenCalledWith('avalon:state', { myId: 'u1' });
      expect(client.emit).not.toHaveBeenCalledWith('avalon:error', expect.anything());
    });

    it('keeps the subscription when re-joining the same room', async () => {
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));
      mockAvalonService.getPlayerView.mockResolvedValue({ myId: 'u1' });
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');
      client.data.avalonRooms = ['ABC123'];

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.leave).not.toHaveBeenCalled();
      expect(client.data.avalonRooms).toEqual(['ABC123']);
      expect(mockAvalonService.markPlayerOffline).not.toHaveBeenCalled();
    });

    it('defaults to an empty room list when the socket has no prior subscription (join)', async () => {
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));
      mockAvalonService.getPlayerView.mockResolvedValue({ myId: 'u1' });
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = {
        id: 'sock-1',
        data: { userId: 'u1' } as { userId?: string; avalonRooms?: string[] },
        emit: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      };

      await gateway.handleJoinGame(client as never, { roomCode: 'ABC123' });

      expect(client.data.avalonRooms).toEqual(['ABC123']);
      expect(client.leave).not.toHaveBeenCalled();
    });
  });

  describe('handleBegin (edge cases)', () => {
    it('does nothing when the room is missing', async () => {
      mockRoomService.getRoom.mockResolvedValue(null);
      const client = buildClient('u1');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '房间不存在',
      });
      expect(mockAvalonService.updateHost).not.toHaveBeenCalled();
      expect(mockAvalonService.beginGame).not.toHaveBeenCalled();
    });

    it('emits an error when a non-host begins (gateway-side host check)', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u2' });
      const client = buildClient('u2');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '仅房主可以开始任务阶段',
      });
      expect(mockAvalonService.updateHost).not.toHaveBeenCalled();
      expect(mockAvalonService.beginGame).not.toHaveBeenCalled();
    });

    it('emits the service error when beginGame rejects for the host', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
      mockAvalonService.beginGame.mockResolvedValue({ error: '当前不是身份揭示阶段' });
      const client = buildClient('u1');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(mockAvalonService.updateHost).toHaveBeenCalledWith('ABC123', 'u1');
      expect(mockAvalonService.beginGame).toHaveBeenCalledWith('ABC123', 'u1');
      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '当前不是身份揭示阶段',
      });
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('emits a generic error when the begin pipeline itself throws', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
      mockAvalonService.updateHost.mockRejectedValueOnce(new Error('db down'));
      const client = buildClient('u1');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '操作失败，请重试',
      });
      expect(mockAvalonService.beginGame).not.toHaveBeenCalled();
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('does not fail the begin when the follow-up broadcast throws', async () => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
      mockAvalonService.beginGame.mockResolvedValue({ success: true, phase: 'team_building', round: 1 });
      mockAvalonService.getAllPlayerViews.mockRejectedValueOnce(new Error('broadcast boom'));
      const client = buildClient('u1');

      await gateway.handleBegin(client as never, { roomCode: 'ABC123' });

      expect(mockAvalonService.beginGame).toHaveBeenCalledWith('ABC123', 'u1');
      expect(roomEmit).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveGame (edge cases)', () => {
    it('logs and continues when checking remaining sockets fails', async () => {
      mockServer.in.mockReturnValueOnce({
        fetchSockets: jest.fn().mockRejectedValue(new Error('adapter boom')),
      });
      const client = buildClient('u1');
      client.data.avalonRooms = ['ABC123'];

      await expect(
        gateway.handleLeaveGame(client as never, { roomCode: 'ABC123' }),
      ).resolves.toBeUndefined();

      expect(mockAvalonService.markPlayerOffline).not.toHaveBeenCalled();
    });

    it('defaults to an empty room list when the socket has no prior subscription (leave)', async () => {
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = {
        id: 'sock-1',
        data: { userId: 'u1' } as { userId?: string; avalonRooms?: string[] },
        emit: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      };

      await gateway.handleLeaveGame(client as never, { roomCode: 'ABC123' });

      expect(client.leave).toHaveBeenCalledWith('avalon:ABC123');
      expect(client.data.avalonRooms).toEqual([]);
      expect(mockAvalonService.markPlayerOffline).toHaveBeenCalledWith('ABC123', 'u1');
    });
  });

  describe('handleProposeTeam', () => {
    beforeEach(() => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
    });

    it('broadcasts state and team_voting phase on success', async () => {
      mockAvalonService.proposeTeam.mockResolvedValue({ success: true });
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleProposeTeam(client as never, {
        roomCode: 'ABC123',
        selectedPlayerIds: ['u1', 'u2'],
      });

      expect(mockAvalonService.proposeTeam).toHaveBeenCalledWith('ABC123', 'u1', ['u1', 'u2']);
      expect(roomEmit).toHaveBeenCalledWith('avalon:phase-changed', {
        phase: 'team_voting',
        proposedTeam: ['u1', 'u2'],
      });
    });

    it('emits avalon:error when the service rejects the proposal', async () => {
      mockAvalonService.proposeTeam.mockResolvedValue({ error: '队伍人数必须为 2 人' });
      const client = buildClient('u1');

      await gateway.handleProposeTeam(client as never, {
        roomCode: 'ABC123',
        selectedPlayerIds: ['u1'],
      });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '队伍人数必须为 2 人',
      });
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('ignores proposals from players outside the room', async () => {
      mockRoomService.getPlayer.mockResolvedValue(null);
      const client = buildClient('u9');

      await gateway.handleProposeTeam(client as never, {
        roomCode: 'ABC123',
        selectedPlayerIds: ['u1'],
      });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '你不在这个房间中',
      });
      expect(mockAvalonService.proposeTeam).not.toHaveBeenCalled();
    });
  });

  describe('handleTeamVote (edge cases)', () => {
    beforeEach(() => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
    });

    it('ignores votes from players outside the room', async () => {
      mockRoomService.getPlayer.mockResolvedValue(null);
      const client = buildClient('u9');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'approve' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '你不在这个房间中',
      });
      expect(mockAvalonService.submitTeamVote).not.toHaveBeenCalled();
    });

    it('emits avalon:error when the vote is rejected by the service', async () => {
      mockAvalonService.submitTeamVote.mockResolvedValue({ error: '你已经投过票了' });
      const client = buildClient('u1');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'approve' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '你已经投过票了',
      });
      expect(mockAvalonService.resolveTeamVote).not.toHaveBeenCalled();
    });

    it('does not resolve the vote while players are still voting', async () => {
      mockAvalonService.submitTeamVote.mockResolvedValue({ success: true });
      mockAvalonService.isTeamVoteComplete.mockResolvedValue(false);
      const client = buildClient('u1');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'approve' });

      expect(mockAvalonService.resolveTeamVote).not.toHaveBeenCalled();
      expect(roomEmit).toHaveBeenCalledWith('avalon:vote-updated', {
        voterId: 'u1',
        message: '有玩家完成了投票',
      });
    });

    it('logs and skips broadcasting when resolveTeamVote fails', async () => {
      mockAvalonService.submitTeamVote.mockResolvedValue({ success: true });
      mockAvalonService.isTeamVoteComplete.mockResolvedValue(true);
      mockAvalonService.resolveTeamVote.mockResolvedValue({ error: '当前不是投票阶段' });
      const client = buildClient('u1');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'approve' });

      expect(roomEmit).toHaveBeenCalledWith('avalon:vote-updated', expect.anything());
      expect(roomEmit).not.toHaveBeenCalledWith('avalon:vote-resolved', expect.anything());
      expect(roomEmit).not.toHaveBeenCalledWith('avalon:phase-changed', expect.anything());
      expect(roomEmit).not.toHaveBeenCalledWith('avalon:game-finished', expect.anything());
    });

    it('summarizes votes without individual choices when votes are anonymous', async () => {
      mockAvalonService.submitTeamVote.mockResolvedValue({ success: true });
      mockAvalonService.isTeamVoteComplete.mockResolvedValue(true);
      mockAvalonService.resolveTeamVote.mockResolvedValue({
        result: {
          approved: true,
          approvals: 3,
          rejections: 2,
          votes: { u1: 'approve' },
          rejectedCount: 0,
        },
        views: new Map(),
      });
      const anonymousState = {
        ...buildState(['u1', 'u2', 'u3', 'u4', 'u5']),
        phase: 'quest_action' as const,
        config: { ...DEFAULT_AVALON_CONFIG, publicTeamVote: false },
      };
      mockAvalonService.getGameState.mockResolvedValue(anonymousState);
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'approve' });

      expect(roomEmit).toHaveBeenCalledWith('avalon:vote-resolved', {
        approved: true,
        approvals: 3,
        rejections: 2,
        rejectedCount: 0,
      });
      expect(roomEmit).toHaveBeenCalledWith('avalon:phase-changed', { phase: 'quest_action' });
    });

    it('falls back to public vote disclosure when the state is unavailable', async () => {
      const resolveResult = {
        result: {
          approved: false,
          approvals: 1,
          rejections: 4,
          votes: {},
          rejectedCount: 2,
        },
        views: new Map(),
      };
      mockAvalonService.submitTeamVote.mockResolvedValue({ success: true });
      mockAvalonService.isTeamVoteComplete.mockResolvedValue(true);
      mockAvalonService.resolveTeamVote.mockResolvedValue(resolveResult);
      mockAvalonService.getGameState.mockResolvedValue(null);
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleTeamVote(client as never, { roomCode: 'ABC123', vote: 'reject' });

      expect(roomEmit).toHaveBeenCalledWith('avalon:vote-resolved', resolveResult.result);
      expect(roomEmit).toHaveBeenCalledWith('avalon:phase-changed', {
        phase: 'team_building',
        rejectedCount: 2,
      });
    });
  });

  describe('handleQuestAction', () => {
    beforeEach(() => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u1' });
    });

    function buildQuestState(phase: 'team_building' | 'quest_action' | 'assassination' | 'finished') {
      return {
        ...buildState(['u1', 'u2', 'u3', 'u4', 'u5']),
        phase,
        round: 2,
        proposedTeam: ['u1', 'u2'],
        questActions: { u1: 'success' as const, u2: 'success' as const },
      };
    }

    it('ignores quest actions from players outside the room', async () => {
      mockRoomService.getPlayer.mockResolvedValue(null);
      const client = buildClient('u9');

      await gateway.handleQuestAction(client as never, { roomCode: 'ABC123', action: 'success' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '你不在这个房间中',
      });
      expect(mockAvalonService.submitQuestAction).not.toHaveBeenCalled();
    });

    it('broadcasts the action update and completes the quest into team_building', async () => {
      mockAvalonService.submitQuestAction.mockResolvedValue({ success: true });
      mockAvalonService.isQuestComplete.mockResolvedValue(true);
      mockAvalonService.resolveQuest.mockResolvedValue({
        result: { round: 1, team: ['u1', 'u2'], successCount: 2, failCount: 0, requiredFailCount: 1, succeeded: true },
        views: new Map(),
      });
      mockAvalonService.getGameState.mockResolvedValue(buildQuestState('team_building'));
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleQuestAction(client as never, { roomCode: 'ABC123', action: 'success' });

      expect(mockAvalonService.submitQuestAction).toHaveBeenCalledWith('ABC123', 'u1', 'success');
      expect(roomEmit).toHaveBeenCalledWith('avalon:quest-action-updated', {
        actedCount: 2,
        totalRequired: 2,
        message: '2/2 名队员已提交',
      });
      expect(roomEmit).toHaveBeenCalledWith('avalon:quest-resolved', expect.objectContaining({ succeeded: true }));
      expect(roomEmit).toHaveBeenCalledWith('avalon:phase-changed', { phase: 'team_building', round: 2 });
    });

    it('does not resolve the quest while team members are still acting', async () => {
      mockAvalonService.submitQuestAction.mockResolvedValue({ success: true });
      mockAvalonService.isQuestComplete.mockResolvedValue(false);
      mockAvalonService.getGameState.mockResolvedValue({
        ...buildQuestState('quest_action'),
        questActions: { u1: 'success' },
      });
      const client = buildClient('u1');

      await gateway.handleQuestAction(client as never, { roomCode: 'ABC123', action: 'success' });

      expect(mockAvalonService.resolveQuest).not.toHaveBeenCalled();
      expect(roomEmit).toHaveBeenCalledWith('avalon:quest-action-updated', {
        actedCount: 1,
        totalRequired: 2,
        message: '1/2 名队员已提交',
      });
    });

    it('emits avalon:error when the service rejects the action', async () => {
      mockAvalonService.submitQuestAction.mockResolvedValue({ error: '你不在任务队伍中' });
      const client = buildClient('u1');

      await gateway.handleQuestAction(client as never, { roomCode: 'ABC123', action: 'success' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '你不在任务队伍中',
      });
      expect(mockAvalonService.resolveQuest).not.toHaveBeenCalled();
    });

    it('emits game-finished when the quest ends the game', async () => {
      const finishedState = {
        ...buildQuestState('finished'),
        winner: 'evil' as const,
        resultReason: 'three_failed_quests' as const,
      };
      mockAvalonService.submitQuestAction.mockResolvedValue({ success: true });
      mockAvalonService.isQuestComplete.mockResolvedValue(true);
      mockAvalonService.resolveQuest.mockResolvedValue({
        result: { round: 2, team: ['u1', 'u2'], successCount: 1, failCount: 1, requiredFailCount: 1, succeeded: false },
        views: new Map(),
      });
      mockAvalonService.getGameState.mockResolvedValue(finishedState);
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleQuestAction(client as never, { roomCode: 'ABC123', action: 'success' });

      expect(roomEmit).toHaveBeenCalledWith('avalon:quest-resolved', expect.anything());
      expect(roomEmit).toHaveBeenCalledWith('avalon:game-finished', {
        winner: 'evil',
        reason: 'three_failed_quests',
      });
    });

    it('emits the assassination phase change when good completes 3 quests', async () => {
      mockAvalonService.submitQuestAction.mockResolvedValue({ success: true });
      mockAvalonService.isQuestComplete.mockResolvedValue(true);
      mockAvalonService.resolveQuest.mockResolvedValue({
        result: { round: 2, team: ['u1', 'u2'], successCount: 2, failCount: 0, requiredFailCount: 1, succeeded: true },
        views: new Map(),
      });
      mockAvalonService.getGameState.mockResolvedValue(buildQuestState('assassination'));
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u1');

      await gateway.handleQuestAction(client as never, { roomCode: 'ABC123', action: 'success' });

      expect(roomEmit).toHaveBeenCalledWith('avalon:phase-changed', { phase: 'assassination' });
    });

    it('logs and skips broadcasting when resolveQuest fails', async () => {
      mockAvalonService.submitQuestAction.mockResolvedValue({ success: true });
      mockAvalonService.isQuestComplete.mockResolvedValue(true);
      mockAvalonService.resolveQuest.mockResolvedValue({ error: '当前不是任务执行阶段' });
      const client = buildClient('u1');

      await gateway.handleQuestAction(client as never, { roomCode: 'ABC123', action: 'success' });

      expect(mockAvalonService.getGameState).toHaveBeenCalledTimes(1); // 仅 quest-action 更新广播读取状态
      expect(roomEmit).toHaveBeenCalledWith('avalon:quest-action-updated', expect.anything());
      expect(roomEmit).not.toHaveBeenCalledWith('avalon:quest-resolved', expect.anything());
      expect(roomEmit).not.toHaveBeenCalledWith('avalon:phase-changed', expect.anything());
    });
  });

  describe('handleAssassinate', () => {
    beforeEach(() => {
      mockRoomService.getPlayer.mockResolvedValue({ userId: 'u5' });
    });

    it('broadcasts the assassination result and the final game state', async () => {
      mockAvalonService.assassinate.mockResolvedValue({
        result: { winner: 'evil', reason: 'merlin_assassinated', assassinatedPlayerId: 'u1' },
        views: new Map(),
      });
      mockAvalonService.getAllPlayerViews.mockResolvedValue(new Map());
      const client = buildClient('u5');

      await gateway.handleAssassinate(client as never, { roomCode: 'ABC123', targetPlayerId: 'u1' });

      expect(mockAvalonService.assassinate).toHaveBeenCalledWith('ABC123', 'u5', 'u1');
      expect(roomEmit).toHaveBeenCalledWith('avalon:assassination-resolved', {
        winner: 'evil',
        reason: 'merlin_assassinated',
        assassinatedPlayerId: 'u1',
      });
      expect(roomEmit).toHaveBeenCalledWith('avalon:game-finished', {
        winner: 'evil',
        reason: 'merlin_assassinated',
        assassinatedPlayerId: 'u1',
      });
    });

    it('emits avalon:error when the service rejects the assassination', async () => {
      mockAvalonService.assassinate.mockResolvedValue({ error: '只有刺客可以执行刺杀' });
      const client = buildClient('u5');

      await gateway.handleAssassinate(client as never, { roomCode: 'ABC123', targetPlayerId: 'u1' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_ERROR,
        message: '只有刺客可以执行刺杀',
      });
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('ignores assassinations from players outside the room', async () => {
      mockRoomService.getPlayer.mockResolvedValue(null);
      const client = buildClient('u9');

      await gateway.handleAssassinate(client as never, { roomCode: 'ABC123', targetPlayerId: 'u1' });

      expect(client.emit).toHaveBeenCalledWith('avalon:error', {
        code: WsErrorCode.ROOM_NOT_FOUND,
        message: '你不在这个房间中',
      });
      expect(mockAvalonService.assassinate).not.toHaveBeenCalled();
    });
  });

  describe('broadcast helpers', () => {
    it('broadcastVoteUpdate includes the voter id for public votes', async () => {
      mockAvalonService.getGameState.mockResolvedValue(buildState(['u1', 'u2', 'u3', 'u4', 'u5']));

      await gateway.broadcastVoteUpdate('ABC123', 'u1');

      expect(roomEmit).toHaveBeenCalledWith('avalon:vote-updated', {
        voterId: 'u1',
        message: '有玩家完成了投票',
      });
    });

    it('broadcastVoteUpdate hides the voter id for anonymous votes', async () => {
      mockAvalonService.getGameState.mockResolvedValue({
        ...buildState(['u1', 'u2', 'u3', 'u4', 'u5']),
        config: { ...DEFAULT_AVALON_CONFIG, publicTeamVote: false },
      });

      await gateway.broadcastVoteUpdate('ABC123', 'u1');

      expect(roomEmit).toHaveBeenCalledWith('avalon:vote-updated', {
        message: '有玩家完成了投票',
      });
    });

    it('broadcastQuestActionUpdate skips when the game state is gone', async () => {
      mockAvalonService.getGameState.mockResolvedValue(null);

      await gateway.broadcastQuestActionUpdate('ABC123');

      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('sendToPlayer targets the per-user channel', () => {
      gateway.sendToPlayer('u9', 'avalon:hello', { a: 1 });

      expect(mockServer.to).toHaveBeenCalledWith('user:u9');
      expect(roomEmit).toHaveBeenCalledWith('avalon:hello', { a: 1 });
    });

    it('broadcastToRoom targets the room channel', () => {
      gateway.broadcastToRoom('ABC123', 'avalon:hello', { b: 2 });

      expect(mockServer.to).toHaveBeenCalledWith('avalon:ABC123');
      expect(roomEmit).toHaveBeenCalledWith('avalon:hello', { b: 2 });
    });
  });
});
