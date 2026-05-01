import { Controller, Post, Request, UseGuards, HttpCode, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
}
