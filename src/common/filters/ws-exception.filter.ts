import { Catch, Logger, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const message = this.extractMessage(exception);

    this.logger.warn(`WebSocket error for client ${client.id}: ${message}`);
    client.emit('room:error', { message });
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }
    if (typeof exception === 'string') {
      return exception;
    }
    if (exception && typeof exception === 'object' && 'message' in exception) {
      return String((exception as { message?: unknown }).message);
    }
    return '服务器内部错误';
  }
}
