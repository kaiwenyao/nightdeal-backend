import { Catch, Logger, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsErrorCode } from '../constants/ws-error-codes';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    let message: string;
    if (exception instanceof WsException) {
      message = exception.message;
    } else {
      message = '服务器内部错误';
    }

    this.logger.warn(`WebSocket error for client ${client.id}: ${message}`);
    client.emit('room:error', { code: WsErrorCode.INTERNAL_ERROR, message });
  }
}
