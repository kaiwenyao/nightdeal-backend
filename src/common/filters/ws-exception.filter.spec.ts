import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsErrorCode } from '../constants/ws-error-codes';
import { WsExceptionFilter } from './ws-exception.filter';

describe('WsExceptionFilter', () => {
  function setup(namespace = '/avalon') {
    const client = { id: 'socket-1', nsp: { name: namespace }, emit: jest.fn() };
    const host = {
      switchToWs: () => ({ getClient: () => client }),
    } as unknown as ArgumentsHost;
    return { client, host };
  }

  it('classifies DTO validation errors as client errors', () => {
    const { client, host } = setup();
    new WsExceptionFilter().catch(new BadRequestException('roomCode must be longer than or equal to 6 characters'), host);

    expect(client.emit).toHaveBeenCalledWith('avalon:error', {
      code: WsErrorCode.ROOM_ERROR,
      message: 'roomCode must be longer than or equal to 6 characters',
    });
  });

  it('preserves internal classification for unexpected errors', () => {
    const { client, host } = setup('/room');
    new WsExceptionFilter().catch(new Error('secret'), host);

    expect(client.emit).toHaveBeenCalledWith('room:error', {
      code: WsErrorCode.INTERNAL_ERROR,
      message: '服务器内部错误',
    });
  });

  it('treats explicit websocket exceptions as client errors', () => {
    const { client, host } = setup();
    new WsExceptionFilter().catch(new WsException('bad payload'), host);

    expect(client.emit).toHaveBeenCalledWith('avalon:error', {
      code: WsErrorCode.ROOM_ERROR,
      message: 'bad payload',
    });
  });
});
