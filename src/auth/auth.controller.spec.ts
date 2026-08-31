import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock; updateProfile: jest.Mock };

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      updateProfile: jest.fn(),
    };
    controller = new AuthController(authService as unknown as AuthService);
  });

  describe('login', () => {
    it('delegates to AuthService.login with the WeChat code', async () => {
      const loginResult = { token: 'jwt-token', user: { id: 'user-1' } };
      authService.login.mockResolvedValue(loginResult);

      const result = await controller.login({ code: 'wx-code' });

      expect(result).toBe(loginResult);
      expect(authService.login).toHaveBeenCalledWith('wx-code');
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('propagates login failures (e.g. WeChat errors)', async () => {
      authService.login.mockRejectedValue(new Error('微信登录失败'));

      await expect(controller.login({ code: 'wx-code' })).rejects.toThrow(
        '微信登录失败',
      );
    });
  });

  describe('updateProfile', () => {
    it('delegates to AuthService.updateProfile with the request user id', async () => {
      const updatedUser = { id: 'user-1', nickName: '小明', avatarUrl: 'https://oss/x.jpg' };
      authService.updateProfile.mockResolvedValue(updatedUser);
      const dto = { nickName: '小明' };

      const result = await controller.updateProfile(
        { user: { id: 'user-1' } },
        dto,
      );

      expect(result).toEqual({ user: updatedUser });
      expect(authService.updateProfile).toHaveBeenCalledWith('user-1', dto);
    });

    it('propagates profile update failures (e.g. invalid avatarUrl)', async () => {
      authService.updateProfile.mockRejectedValue(new Error('头像地址不合法'));

      await expect(
        controller.updateProfile({ user: { id: 'user-1' } }, { avatarUrl: '' }),
      ).rejects.toThrow('头像地址不合法');
    });
  });
});
