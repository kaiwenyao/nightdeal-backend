import { Controller, Logger, Post, Request, UseGuards, HttpCode, UnauthorizedException, UseInterceptors, UploadedFile, BadRequestException, GoneException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { StorageService } from './storage.service';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth/avatar')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post('credential')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '获取头像上传凭证（已废弃，请使用 POST /auth/avatar/upload）', deprecated: true })
  @ApiResponse({ status: 410, description: '头像直传凭证接口已废弃，请使用 POST /auth/avatar/upload' })
  @UseGuards(AuthGuard)
  async getAvatarCredential(@Request() req: any): Promise<never> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('用户信息不存在');
    }
    this.logger.warn(
      `Deprecated OSS credential endpoint accessed by user ${userId}. ` +
        'Direct upload credentials are disabled; use POST /auth/avatar/upload.',
    );
    throw new GoneException('头像直传凭证接口已废弃，请使用服务端头像上传');
  }

  @Post('upload')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '上传并压缩头像（后端处理）', description: '上传图片文件，后端压缩后上传到阿里云OSS' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '上传成功', schema: { type: 'object', properties: { avatarUrl: { type: 'string', description: 'OSS 头像 URL' } } } })
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, cb: any) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      cb(null, allowed.includes(file.mimetype));
    },
  }))
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number } | undefined,
  ): Promise<{ avatarUrl: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('用户信息不存在');
    }

    if (!file) {
      throw new BadRequestException('未上传图片文件');
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG、PNG、WebP、GIF 格式的图片');
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }

    try {
      const avatarUrl = await this.storageService.compressAndUploadAvatar(file.buffer, userId);
      return { avatarUrl };
    } catch (error: unknown) {
      this.logger.error('Avatar processing failed', error);
      throw new BadRequestException('头像处理失败，请重试');
    }
  }
}
