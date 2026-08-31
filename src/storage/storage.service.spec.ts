import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { StorageService } from './storage.service';

// Mock ali-oss so the service can be constructed without real credentials and
// uploadAvatar can be tested without network access.
const putMock = jest.fn().mockResolvedValue({ name: 'ok' });
jest.mock('ali-oss', () => {
  return jest.fn().mockImplementation(() => ({ put: putMock }));
});

// Mock sharp: compressAvatar only relies on the resize/jpeg/toBuffer chain.
let sharpChainFactory: jest.Mock;
jest.mock('sharp', () => {
  return jest.fn().mockImplementation((...args: unknown[]) => sharpChainFactory(...args));
});

const OSSMock = OSS as unknown as jest.Mock;

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

  // Build a fake sharp() return value: the resize/jpeg calls are recorded and
  // toBuffer resolves with the queued buffers in order (the last one repeats).
  function queueSharpChains(toBufferLengths: number[]) {
    const toBufferMock = jest.fn();
    toBufferLengths.forEach((length) => {
      toBufferMock.mockResolvedValueOnce(Buffer.alloc(length));
    });
    if (toBufferLengths.length > 0) {
      toBufferMock.mockResolvedValue(Buffer.alloc(toBufferLengths[toBufferLengths.length - 1]));
    }
    const chain = {
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: toBufferMock,
    };
    sharpChainFactory = jest.fn(() => chain);
    return { sharpFactory: sharpChainFactory, chain };
  }

  describe('constructor', () => {
    it('builds the OSS client from the configured credentials', () => {
      createService('https://cdn.example.com/avatars/');
      const ctorArgs = OSSMock.mock.calls[OSSMock.mock.calls.length - 1][0];
      expect(ctorArgs).toEqual({
        region: 'oss-test',
        accessKeyId: 'id',
        accessKeySecret: 'secret',
        bucket: 'bucket',
        endpoint: 'https://bucket.oss-test.aliyuncs.com',
        secure: true,
      });
    });
  });

  describe('compressAvatar', () => {
    it('returns the first compressed buffer when it already fits the size budget', async () => {
      const { sharpFactory, chain } = queueSharpChains([50 * 1024]);
      const service = createService('https://cdn.example.com/avatars/');
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

      const buffer = await service.compressAvatar(Buffer.alloc(200 * 1024));

      expect(buffer.length).toBe(50 * 1024);
      expect(sharpFactory).toHaveBeenCalledTimes(1);
      expect(chain.resize).toHaveBeenCalledWith(256, 256, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(chain.jpeg).toHaveBeenCalledWith({ quality: 80, progressive: true });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('80%'));
    });

    it('lowers the quality step by step until the buffer fits', async () => {
      const { sharpFactory, chain } = queueSharpChains([150 * 1024, 120 * 1024, 60 * 1024]);
      const service = createService('https://cdn.example.com/avatars/');

      const buffer = await service.compressAvatar(Buffer.alloc(300 * 1024));

      expect(buffer.length).toBe(60 * 1024);
      // quality 80 is still too big → retries at 70 then 60
      expect(sharpFactory).toHaveBeenCalledTimes(3);
      expect(chain.jpeg.mock.calls.map((call) => call[0].quality)).toEqual([80, 70, 60]);
    });

    it('stops lowering the quality at the floor of 30%', async () => {
      const { sharpFactory, chain } = queueSharpChains([200 * 1024]);
      const service = createService('https://cdn.example.com/avatars/');

      const buffer = await service.compressAvatar(Buffer.alloc(300 * 1024));

      // 80 → 70 → 60 → 50 → 40 → 30, then the loop exits at the floor
      expect(sharpFactory).toHaveBeenCalledTimes(6);
      expect(chain.jpeg).toHaveBeenLastCalledWith({ quality: 30, progressive: true });
      expect(buffer.length).toBe(200 * 1024);
    });
  });

  describe('compressAndUploadAvatar', () => {
    it('compresses the buffer and uploads it under the user-scoped OSS key', async () => {
      queueSharpChains([10 * 1024]);
      const service = createService('https://cdn.example.com/avatars');
      jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
      const input = Buffer.from('raw-image');

      const url = await service.compressAndUploadAvatar(input, 'user-42');

      expect(putMock).toHaveBeenCalledWith(
        expect.stringMatching(/^avatars\/user-42\/\d+\.jpg$/),
        expect.any(Buffer),
        {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000',
          },
        },
      );
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/avatars\/user-42\/\d+\.jpg$/);
    });
  });

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
