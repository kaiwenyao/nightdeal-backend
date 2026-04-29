import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录');
    }

    const token = authHeader.substring(7);
    const userId = await this.authService.verifyToken(token);

    if (!userId) {
      throw new UnauthorizedException('登录态失效');
    }

    // 将用户信息附加到 request 对象
    request.user = { id: userId };
    return true;
  }
}
