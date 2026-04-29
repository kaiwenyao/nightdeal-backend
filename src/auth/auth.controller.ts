import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.code);
  }

  @Post('update-profile')
  @UseGuards(AuthGuard)
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return {
      user: {
        id: req.user.id,
        ...dto,
      },
    };
  }
}
