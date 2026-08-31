import { isAllowedAvatarUrl } from './avatar-url';

const PREFIX = 'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/';

describe('isAllowedAvatarUrl', () => {
  describe('empty URL means "clear avatar"', () => {
    it('accepts an empty string regardless of the prefix', () => {
      expect(isAllowedAvatarUrl('', PREFIX)).toBe(true);
      expect(isAllowedAvatarUrl('', undefined)).toBe(true);
    });
  });

  describe('prefix handling', () => {
    it('rejects every non-empty URL when no prefix is configured', () => {
      expect(isAllowedAvatarUrl('https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/a.jpg', undefined)).toBe(false);
    });

    it('appends the missing trailing slash to the configured prefix', () => {
      expect(
        isAllowedAvatarUrl(
          'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/user-1/1.jpg',
          'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars',
        ),
      ).toBe(true);
    });

    it('keeps an existing trailing slash on the configured prefix', () => {
      expect(
        isAllowedAvatarUrl(
          'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/user-1/1.jpg',
          PREFIX,
        ),
      ).toBe(true);
    });
  });

  describe('candidate URL rules', () => {
    it.each([
      ['http protocol', 'http://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/a.jpg'],
      ['ftp protocol', 'ftp://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/a.jpg'],
      ['embedded credentials', 'https://user:pass@bucket.oss-cn-hangzhou.aliyuncs.com/avatars/a.jpg'],
      ['different host', 'https://evil.example.com/avatars/a.jpg'],
      ['lookalike host suffix', 'https://bucket.oss-cn-hangzhou.aliyuncs.com.evil.com/avatars/a.jpg'],
      ['path outside the allowed prefix', 'https://bucket.oss-cn-hangzhou.aliyuncs.com/other/a.jpg'],
      ['prefix that is only a path substring', 'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatarsx/a.jpg'],
    ])('rejects a URL with %s', (_case, url) => {
      expect(isAllowedAvatarUrl(url, PREFIX)).toBe(false);
    });

    it('accepts a nested path under the allowed prefix', () => {
      expect(
        isAllowedAvatarUrl(
          'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/user-9/sub/2.jpg',
          PREFIX,
        ),
      ).toBe(true);
    });
  });

  describe('malformed URLs', () => {
    it('rejects an unparseable candidate URL', () => {
      expect(isAllowedAvatarUrl('not a url at all', PREFIX)).toBe(false);
    });

    it('rejects an unparseable prefix', () => {
      expect(
        isAllowedAvatarUrl('https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/a.jpg', '::not-a-url'),
      ).toBe(false);
    });
  });
});
