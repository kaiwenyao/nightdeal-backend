import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
import { IsAvatarUrlConstraint, UpdateProfileDto } from './update-profile.dto';

const AVATAR_URL_PREFIX = 'https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/';
const originalPrefix = process.env.AVATAR_URL_PREFIX;

describe('Auth DTOs', () => {
  beforeEach(() => {
    process.env.AVATAR_URL_PREFIX = AVATAR_URL_PREFIX;
  });

  afterEach(() => {
    if (originalPrefix === undefined) {
      delete process.env.AVATAR_URL_PREFIX;
    } else {
      process.env.AVATAR_URL_PREFIX = originalPrefix;
    }
  });

  describe('LoginDto', () => {
    it('accepts a non-empty WeChat code', async () => {
      const dto = plainToInstance(LoginDto, { code: 'wx-code-123' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('rejects a missing code', async () => {
      const dto = plainToInstance(LoginDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('code');
    });

    it('rejects an empty string code', async () => {
      const dto = plainToInstance(LoginDto, { code: '' });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['code']);
    });

    it('rejects a non-string code', async () => {
      const dto = plainToInstance(LoginDto, { code: 12345 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('UpdateProfileDto.nickName', () => {
    it('accepts a nickname of allowed characters within the length limit', async () => {
      const dto = plainToInstance(UpdateProfileDto, { nickName: '小明_01·A-b ' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('accepts a missing nickname (optional field)', async () => {
      const dto = plainToInstance(UpdateProfileDto, {});
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('rejects an empty nickname', async () => {
      const dto = plainToInstance(UpdateProfileDto, { nickName: '' });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['nickName']);
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('rejects a nickname longer than 20 characters', async () => {
      const dto = plainToInstance(UpdateProfileDto, { nickName: 'a'.repeat(21) });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['nickName']);
    });

    it('rejects a nickname with disallowed characters', async () => {
      const dto = plainToInstance(UpdateProfileDto, { nickName: 'evil<script>' });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['nickName']);
      expect(errors[0].constraints?.matches).toBe('昵称只能包含中文、字母、数字和常见符号');
    });
  });

  describe('UpdateProfileDto.avatarUrl', () => {
    it('accepts an HTTPS URL under the configured prefix', async () => {
      const dto = plainToInstance(UpdateProfileDto, {
        avatarUrl: `${AVATAR_URL_PREFIX}user-1/123.jpg`,
      });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('accepts an empty string (clear avatar)', async () => {
      const dto = plainToInstance(UpdateProfileDto, { avatarUrl: '' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('accepts a missing avatarUrl (optional field)', async () => {
      const dto = plainToInstance(UpdateProfileDto, { nickName: '小明' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('rejects a URL on a disallowed host', async () => {
      const dto = plainToInstance(UpdateProfileDto, {
        avatarUrl: 'https://evil.example.com/avatars/x.jpg',
      });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['avatarUrl']);
      expect(errors[0].constraints).toHaveProperty('IsAvatarUrl');
    });

    it('rejects a non-HTTPS URL', async () => {
      const dto = plainToInstance(UpdateProfileDto, {
        avatarUrl: 'http://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/x.jpg',
      });
      expect(await validate(dto)).not.toHaveLength(0);
    });

    it('rejects a URL longer than 512 characters', async () => {
      const dto = plainToInstance(UpdateProfileDto, {
        avatarUrl: `${AVATAR_URL_PREFIX}${'a'.repeat(500)}.jpg`,
      });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['avatarUrl']);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('rejects a non-string avatarUrl', async () => {
      const dto = plainToInstance(UpdateProfileDto, { avatarUrl: 123 });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['avatarUrl']);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('uses the configured constraint message', () => {
      const constraint = new IsAvatarUrlConstraint();
      expect(constraint.validate('https://evil.example.com/x.jpg', {} as never)).toBe(false);
      expect(constraint.validate('https://bucket.oss-cn-hangzhou.aliyuncs.com/avatars/x.jpg', {} as never)).toBe(true);
      expect(constraint.validate(123 as unknown as string, {} as never)).toBe(false);
      expect(constraint.defaultMessage({ property: 'avatarUrl' } as never)).toBe(
        'avatarUrl must be a valid HTTPS URL starting with AVATAR_URL_PREFIX',
      );
    });
  });
});
