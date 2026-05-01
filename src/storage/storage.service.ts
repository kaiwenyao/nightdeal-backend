import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

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
  constructor(private readonly configService: ConfigService) {}

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
