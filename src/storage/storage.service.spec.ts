import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

// Mock ali-oss so the service can be constructed without real credentials and
// uploadAvatar can be tested without network access.
const putMock = jest.fn().mockResolvedValue({ name: 'ok' });
jest.mock('ali-oss', () => {
  return jest.fn().mockImplementation(() => ({ put: putMock }));
});

describe('StorageService', () => {
  beforeEach(() => {
    putMock.mockClear();
  });

  function createService(avatarUrlPrefix: string): StorageService {
    const config = {
      get: (key: string) => {
        const values: Record<string, string> = {
          OSS_REGION: 'oss-test',
          OSS_ACCESS_KEY_ID: 'id',
          OSS_ACCESS_KEY_SECRET: 'secret',
          OSS_BUCKET: 'bucket',
          OSS_ENDPOINT: 'https://bucket.oss-test.aliyuncs.com',
          AVATAR_URL_PREFIX: avatarUrlPrefix,
        };
        return values[key];
      },
    } as unknown as ConfigService;
    return new StorageService(config);
  }

  describe('uploadAvatar', () => {
    it('builds the URL directly when the configured prefix ends with a slash', async () => {
      const service = createService('https://cdn.example.com/avatars/');
      const url = await service.uploadAvatar(Buffer.from('img'), 'user-1');
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/avatars\/user-1\/\d+\.jpg$/);
    });

    it('normalizes a prefix without a trailing slash instead of producing a malformed URL', async () => {
      const service = createService('https://cdn.example.com/avatars');
      const url = await service.uploadAvatar(Buffer.from('img'), 'user-1');
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/avatars\/user-1\/\d+\.jpg$/);
    });
  });
});
