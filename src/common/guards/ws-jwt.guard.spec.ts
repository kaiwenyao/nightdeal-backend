import { ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';
import { WsErrorCode, wsErrorEvent } from '../constants/ws-error-codes';
import { WsJwtGuard } from './ws-jwt.guard';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let authService: { verifyToken: jest.Mock };
  let client: {
    data: Record<string, unknown>;
    handshake: { auth?: Record<string, unknown>; headers?: Record<string, unknown> };
    nsp?: { name: string };
    emit: jest.Mock;
    disconnect: jest.Mock;
  };

  function buildContext(): ExecutionContext {
    return {
      switchToWs: () => ({ getClient: () => client }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    authService = { verifyToken: jest.fn() };
    guard = new WsJwtGuard(authService as unknown as AuthService);
    client = {
      data: {},
      handshake: {},
      nsp: { name: '/room' },
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
  });

  it('accepts a token from handshake.auth, tags the socket and returns true', async () => {
    client.handshake = { auth: { token: ' ws-token ' } };
    authService.verifyToken.mockResolvedValue('user-1');

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);

    expect(authService.verifyToken).toHaveBeenCalledWith('ws-token');
    expect(client.data.userId).toBe('user-1');
    expect(client.emit).not.toHaveBeenCalled();
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('falls back to the Bearer Authorization header when handshake.auth has no usable token', async () => {
    client.handshake = {
      auth: { token: '   ' },
      headers: { authorization: 'Bearer header-token' },
    };
    authService.verifyToken.mockResolvedValue('user-2');

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);

    expect(authService.verifyToken).toHaveBeenCalledWith('header-token');
    expect(client.data.userId).toBe('user-2');
  });

  it('accepts a raw Authorization header without the Bearer prefix', async () => {
    client.handshake = { headers: { authorization: 'raw-token' } };
    authService.verifyToken.mockResolvedValue('user-3');

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
    expect(authService.verifyToken).toHaveBeenCalledWith('raw-token');
  });

  it('treats a case-insensitive bearer prefix as a prefix too', async () => {
    client.handshake = { headers: { authorization: 'BEARER upper-token' } };
    authService.verifyToken.mockResolvedValue('user-4');

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
    expect(authService.verifyToken).toHaveBeenCalledWith('upper-token');
  });

  it('rejects when neither handshake.auth nor headers carry a token', async () => {
    const result = await guard.canActivate(buildContext());

    expect(result).toBe(false);
    expect(authService.verifyToken).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith(wsErrorEvent('/room'), {
      code: WsErrorCode.UNAUTHORIZED,
      message: '未登录',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects when handshake.auth and handshake.headers are both missing', async () => {
    client.handshake = {};

    const result = await guard.canActivate(buildContext());

    expect(result).toBe(false);
    expect(client.emit).toHaveBeenCalledWith('room:error', {
      code: WsErrorCode.UNAUTHORIZED,
      message: '未登录',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('emits on the default error event when the socket has no namespace', async () => {
    client.nsp = undefined;
    client.handshake = { auth: {} };

    await guard.canActivate(buildContext());

    expect(client.emit).toHaveBeenCalledWith('room:error', {
      code: WsErrorCode.UNAUTHORIZED,
      message: '未登录',
    });
  });

  it('rejects and disconnects when the token does not verify', async () => {
    client.handshake = { auth: { token: 'bad-token' } };
    authService.verifyToken.mockResolvedValue(null);

    const result = await guard.canActivate(buildContext());

    expect(result).toBe(false);
    expect(authService.verifyToken).toHaveBeenCalledWith('bad-token');
    expect(client.data.userId).toBeUndefined();
    expect(client.emit).toHaveBeenCalledWith(wsErrorEvent('/room'), {
      code: WsErrorCode.UNAUTHORIZED,
      message: '登录态失效',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('emits the namespace-specific error event on the avalon namespace', async () => {
    client.nsp = { name: '/avalon' };
    client.handshake = { auth: {} };

    await guard.canActivate(buildContext());

    expect(client.emit).toHaveBeenCalledWith('avalon:error', {
      code: WsErrorCode.UNAUTHORIZED,
      message: '未登录',
    });
  });
});
