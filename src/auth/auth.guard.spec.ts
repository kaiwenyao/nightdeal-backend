import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: { verifyToken: jest.Mock };
  let request: {
    headers: Record<string, string | undefined>;
    user?: { id: string };
  };

  function buildContext(): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    authService = { verifyToken: jest.fn() };
    guard = new AuthGuard(authService as unknown as AuthService);
    request = { headers: {} };
  });

  it('attaches the authenticated user to the request and returns true', async () => {
    request.headers.authorization = 'Bearer user-token';
    authService.verifyToken.mockResolvedValue('user-1');

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);

    expect(authService.verifyToken).toHaveBeenCalledWith('user-token');
    expect(request.user).toEqual({ id: 'user-1' });
  });

  it('rejects when the Authorization header is missing', async () => {
    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    try {
      await guard.canActivate(buildContext());
    } catch (error) {
      expect((error as UnauthorizedException).message).toBe('未登录');
    }
    expect(authService.verifyToken).not.toHaveBeenCalled();
  });

  it('rejects when the Authorization header is not a Bearer token', async () => {
    request.headers.authorization = 'Basic dXNlcjpwYXNz';

    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(authService.verifyToken).not.toHaveBeenCalled();
  });

  it('rejects when the token does not verify', async () => {
    request.headers.authorization = 'Bearer bad-token';
    authService.verifyToken.mockResolvedValue(null);

    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    try {
      await guard.canActivate(buildContext());
    } catch (error) {
      expect((error as UnauthorizedException).message).toBe('登录态失效');
    }
    expect(request.user).toBeUndefined();
  });
});
