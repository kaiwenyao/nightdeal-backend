import { Controller, Post, Request, UseGuards, HttpCode, UnauthorizedException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { StorageService, AvatarUploadCredential } from './storage.service';
import { AvatarCredentialResponseDto } from './dto/avatar-credential-response.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth/avatar')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('credential')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '获取头像上传凭证' })
  @ApiResponse({ status: 200, type: AvatarCredentialResponseDto })
  @UseGuards(AuthGuard)
  async getAvatarCredential(@Request() req: any): Promise<AvatarUploadCredential> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('用户信息不存在');
    }
    return this.storageService.getAvatarUploadCredential(userId);
  }

  @Post('upload')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '上传并压缩头像（后端处理）', description: '上传图片文件，后端压缩后上传到阿里云OSS' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '上传成功', schema: { type: 'object', properties: { avatarUrl: { type: 'string', description: 'OSS 头像 URL' } } } })
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
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

    const avatarUrl = await this.storageService.compressAndUploadAvatar(file.buffer, userId);
    return { avatarUrl };
  }
}
