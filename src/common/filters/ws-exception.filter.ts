import { Catch, Logger, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsErrorCode, wsErrorEvent } from '../constants/ws-error-codes';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    let message: string;
    let code: WsErrorCode;
    if (exception instanceof WsException || exception instanceof BadRequestException) {
      message = exception.message;
      code = WsErrorCode.ROOM_ERROR;
    } else {
      message = '服务器内部错误';
      code = WsErrorCode.INTERNAL_ERROR;
    }

    this.logger.warn(`WebSocket error for client ${client.id}: ${message}`);
    client.emit(wsErrorEvent(client.nsp?.name), { code, message });
  }
}
