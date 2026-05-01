import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import sharp from 'sharp';
import OSS from 'ali-oss';

export interface AvatarUploadCredential {
  accessKeyId: string;
  securityToken?: string;
  policy: string;
  signature: string;
  key: string;
  bucket: string;
  region: string;
  host: string;
  expiredTime: number;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly ossClient: OSS;

  constructor(private readonly configService: ConfigService) {
    this.ossClient = new OSS({
      region: this.configService.get<string>('OSS_REGION')!,
      accessKeyId: this.configService.get<string>('OSS_ACCESS_KEY_ID')!,
      accessKeySecret: this.configService.get<string>('OSS_ACCESS_KEY_SECRET')!,
      bucket: this.configService.get<string>('OSS_BUCKET')!,
      endpoint: this.configService.get<string>('OSS_ENDPOINT')!,
      secure: true,
    });
  }

  /**
   * 压缩头像图片
   * - 限制最大尺寸 256x256（保持比例）
   * - 转换为 JPEG 格式
   * - 质量 80%
   * - 如果压缩后仍大于 100KB，进一步降低质量
   */
  async compressAvatar(buffer: Buffer): Promise<Buffer> {
    const maxDimension = 256;
    const maxFileSize = 100 * 1024; // 100KB
    let quality = 80;

    let compressed = await sharp(buffer)
      .resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    // 如果仍然过大，逐步降低质量
    while (compressed.length > maxFileSize && quality > 30) {
      quality -= 10;
      compressed = await sharp(buffer)
        .resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();
    }

    this.logger.log(
      `Avatar compressed: ${buffer.length} bytes → ${compressed.length} bytes ` +
        `(quality: ${quality}%)`,
    );

    return compressed;
  }

  /**
   * 上传头像到阿里云 OSS
   * 返回公开的 HTTPS URL
   */
  async uploadAvatar(
    fileBuffer: Buffer,
    userId: string,
  ): Promise<string> {
    const keyPrefix =
      this.configService.get<string>('OSS_AVATAR_KEY_PREFIX') || 'avatars/';
    const timestamp = Date.now();
    const key = `${keyPrefix}${userId}/${timestamp}.jpg`;

    const result = await this.ossClient.put(key, fileBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });

    this.logger.log(`Avatar uploaded to OSS: ${result.name}`);

    // 构建公开访问 URL
    const avatarUrlPrefix = this.configService.get<string>('AVATAR_URL_PREFIX')!;
    return `${avatarUrlPrefix}${key}`;
  }

  /**
   * 完整流程：压缩并上传头像
   */
  async compressAndUploadAvatar(
    fileBuffer: Buffer,
    userId: string,
  ): Promise<string> {
    const compressed = await this.compressAvatar(fileBuffer);
    return this.uploadAvatar(compressed, userId);
  }

  // ========== 原有方法：生成 OSS 直传凭证（保留供前端直传场景使用）==========

  getAvatarUploadCredential(userId: string): AvatarUploadCredential {
    const accessKeyId = this.configService.get<string>('OSS_ACCESS_KEY_ID') || '';
    const accessKeySecret = this.configService.get<string>('OSS_ACCESS_KEY_SECRET') || '';
    const bucket = this.configService.get<string>('OSS_BUCKET') || '';
    const region = this.configService.get<string>('OSS_REGION') || '';
    const keyPrefix = this.configService.get<string>('OSS_AVATAR_KEY_PREFIX') || 'avatars/';
    const host = this.configService.get<string>('OSS_ENDPOINT') || '';

    const key = `avatars/${userId}/${Date.now()}.jpg`;

    const expirationDate = new Date(Date.now() + 10 * 60 * 1000);
    const expirationIso = expirationDate.toISOString();

    const policyObj: Record<string, unknown> = {
      expiration: expirationIso,
      conditions: [
        { bucket },
        ['starts-with', '$key', `${keyPrefix}${userId}/`],
        ['content-length-range', 0, 2097152],
        ['starts-with', '$Content-Type', 'image/'],
      ],
    };

    const policyJson = JSON.stringify(policyObj);
    const policyBase64 = Buffer.from(policyJson).toString('base64');
    const signature = crypto.createHmac('sha1', accessKeySecret).update(policyBase64).digest('base64');

    const publicUrl = `${host}/${key}`;
    const expiredTime = Math.floor(expirationDate.getTime() / 1000);

    return {
      accessKeyId,
      policy: policyBase64,
      signature,
      key,
      bucket,
      region,
      host,
      expiredTime,
      publicUrl,
    };
  }
}
