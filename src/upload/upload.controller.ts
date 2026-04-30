import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AuthGuard } from '../auth/auth.guard';
import { UploadService } from './upload.service';

const avatarStorage = diskStorage({
  destination: (req, file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'avatars');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop() || 'jpeg';
    const { v4: uuidv4 } = require('uuid');
    cb(null, `${uuidv4()}.${ext}`);
  },
});

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传头像', description: '上传头像文件并返回可访问的URL' })
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage,
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('只允许上传图片文件'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的头像文件');
    }

    const avatarUrl = this.uploadService.getAvatarUrl(file.filename);

    return {
      url: avatarUrl,
      filename: file.filename,
    };
  }
}
