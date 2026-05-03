import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';
import { WsErrorCode } from '../constants/ws-error-codes';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    const token = this.extractToken(client);
    if (!token) {
      this.reject(client, '未登录');
      return false;
    }

    const userId = await this.authService.verifyToken(token);
    if (!userId) {
      this.reject(client, '登录态失效');
      return false;
    }

    client.data.userId = userId;
    return true;
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;
    const queryTokenRaw = client.handshake.query?.token;
    const queryToken = Array.isArray(queryTokenRaw) ? queryTokenRaw[0] : queryTokenRaw;

    return (
      (typeof authToken === 'string' && authToken.trim()) ||
      (typeof queryToken === 'string' && queryToken.trim()) ||
      undefined
    );
  }

  private reject(client: Socket, message: string): void {
    client.emit('room:error', { code: WsErrorCode.UNAUTHORIZED, message });
    client.disconnect(true);
  }
}
