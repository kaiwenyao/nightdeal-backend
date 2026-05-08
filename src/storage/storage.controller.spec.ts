import { GoneException, Logger, UnauthorizedException } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

describe('StorageController', () => {
  let controller: StorageController;
  let storageService: jest.Mocked<Pick<StorageService, 'compressAndUploadAvatar'>>;

  beforeEach(() => {
    storageService = {
      compressAndUploadAvatar: jest.fn(),
    };
    controller = new StorageController(storageService as unknown as StorageService);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
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
});
