import { GoneException, Logger, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

// Capture the multer options the controller registers so the fileFilter and
// size limit can be asserted without touching real multipart parsing.
jest.mock('@nestjs/platform-express', () => ({
  FileInterceptor: jest.fn(() => class MockInterceptor {}),
}));

const FileInterceptorMock = jest.mocked(FileInterceptor);
const avatarInterceptorOptions = FileInterceptorMock.mock.calls[0][1] as {
  limits: { fileSize: number };
  fileFilter: (req: unknown, file: { mimetype: string }, cb: (err: unknown, ok: boolean) => void) => void;
};

describe('StorageController', () => {
  let controller: StorageController;
  let storageService: jest.Mocked<Pick<StorageService, 'compressAndUploadAvatar'>>;

  beforeEach(() => {
    storageService = {
      compressAndUploadAvatar: jest.fn(),
    };
    controller = new StorageController(storageService as unknown as StorageService);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAvatarCredential', () => {
    it('rejects the deprecated direct upload credential endpoint', async () => {
      await expect(
        controller.getAvatarCredential({ user: { id: 'user-1' } }),
      ).rejects.toBeInstanceOf(GoneException);

      expect(storageService.compressAndUploadAvatar).not.toHaveBeenCalled();
    });

    it('still requires an authenticated user before returning the deprecation response', async () => {
      await expect(controller.getAvatarCredential({ user: null })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('uploadAvatar', () => {
    const buffer = Buffer.from('image-bytes');

    it('uploads the file through StorageService and returns the avatar URL', async () => {
      storageService.compressAndUploadAvatar.mockResolvedValue(
        'https://cdn.example.com/avatars/user-1/1.jpg',
      );

      const result = await controller.uploadAvatar(
        { user: { id: 'user-1' } },
        { buffer, mimetype: 'image/png', size: 1024 },
      );

      expect(result).toEqual({
        avatarUrl: 'https://cdn.example.com/avatars/user-1/1.jpg',
      });
      expect(storageService.compressAndUploadAvatar).toHaveBeenCalledWith(buffer, 'user-1');
    });

    it('rejects when the request carries no authenticated user', async () => {
      await expect(
        controller.uploadAvatar({ user: null }, { buffer, mimetype: 'image/png', size: 1024 }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(storageService.compressAndUploadAvatar).not.toHaveBeenCalled();
    });

    it('rejects when no file was uploaded', async () => {
      await expect(
        controller.uploadAvatar({ user: { id: 'user-1' } }, undefined),
      ).rejects.toThrow('未上传图片文件');
      expect(storageService.compressAndUploadAvatar).not.toHaveBeenCalled();
    });

    it('rejects unsupported mimetypes', async () => {
      await expect(
        controller.uploadAvatar(
          { user: { id: 'user-1' } },
          { buffer, mimetype: 'application/pdf', size: 1024 },
        ),
      ).rejects.toThrow('仅支持 JPG、PNG、WebP、GIF 格式的图片');
      expect(storageService.compressAndUploadAvatar).not.toHaveBeenCalled();
    });

    it('rejects files larger than 5MB', async () => {
      await expect(
        controller.uploadAvatar(
          { user: { id: 'user-1' } },
          { buffer, mimetype: 'image/jpeg', size: 5 * 1024 * 1024 + 1 },
        ),
      ).rejects.toThrow('图片大小不能超过 5MB');
      expect(storageService.compressAndUploadAvatar).not.toHaveBeenCalled();
    });

    it('wraps processing failures into a BadRequestException', async () => {
      storageService.compressAndUploadAvatar.mockRejectedValue(new Error('sharp exploded'));

      await expect(
        controller.uploadAvatar(
          { user: { id: 'user-1' } },
          { buffer, mimetype: 'image/jpeg', size: 1024 },
        ),
      ).rejects.toThrow('头像处理失败，请重试');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('FileInterceptor configuration', () => {
    it('restricts uploads to the supported image mimetypes', () => {
      const cb = jest.fn();
      const { fileFilter } = avatarInterceptorOptions;

      for (const mimetype of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
        fileFilter({}, { mimetype }, cb);
      }
      expect(cb).toHaveBeenCalledTimes(4);
      expect(cb).toHaveBeenNthCalledWith(1, null, true);
      expect(cb).toHaveBeenNthCalledWith(4, null, true);

      cb.mockClear();
      fileFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(null, false);
    });

    it('caps the upload size at 5MB', () => {
      expect(avatarInterceptorOptions.limits.fileSize).toBe(5 * 1024 * 1024);
    });
  });
});
