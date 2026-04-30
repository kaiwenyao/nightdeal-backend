import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.baseUrl = this.config.get<string>('UPLOAD_BASE_URL') || 'http://localhost:3000';
    
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getAvatarPath(filename: string): string {
    return join(this.uploadDir, 'avatars', filename);
  }

  getAvatarUrl(filename: string): string {
    return `${this.baseUrl}/uploads/avatars/${filename}`;
  }

  generateFilename(originalname: string): string {
    const ext = originalname.split('.').pop() || 'jpeg';
    return `${uuidv4()}.${ext}`;
  }
}
