import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '微信登录', description: '使用微信 code 登录获取 token' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.code);
  }

  @Post('update-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户资料', description: '更新用户昵称和头像' })
  @UseGuards(AuthGuard)
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.authService.updateProfile(req.user.id, dto);
    return { user };
  }

}
