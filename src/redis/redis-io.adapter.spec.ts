import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisIoAdapter } from './redis-io.adapter';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));
jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: jest.fn(),
}));

const createClientMock = jest.mocked(createClient);
const createAdapterMock = jest.mocked(createAdapter);

describe('RedisIoAdapter', () => {
  let serverMock: { adapter: jest.Mock };

  function makeRedisClient() {
    return {
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      duplicate: jest.fn(),
    };
  }

  function createAdapter(config?: { get: (key: string) => unknown }): RedisIoAdapter {
    return new RedisIoAdapter({ app: true }, config as never);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    serverMock = { adapter: jest.fn() };
    jest.spyOn(IoAdapter.prototype, 'createIOServer').mockImplementation(function superStub() {
      return serverMock;
    });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('connects a pub/sub client pair and installs the redis adapter', async () => {
    const pubClient = makeRedisClient();
    const subClient = makeRedisClient();
    pubClient.duplicate.mockReturnValue(subClient);
    createClientMock.mockReturnValue(pubClient as never);
    const adapterConstructor = jest.fn();
    createAdapterMock.mockReturnValue(adapterConstructor as never);

    const adapter = createAdapter({ get: () => 'redis://redis-host:6380' });
    await adapter.connectToRedis();

    expect(createClientMock).toHaveBeenCalledWith({
      url: 'redis://redis-host:6380',
      socket: { reconnectStrategy: expect.any(Function) },
    });
    expect(pubClient.duplicate).toHaveBeenCalledTimes(1);
    expect(pubClient.connect).toHaveBeenCalledTimes(1);
    expect(subClient.connect).toHaveBeenCalledTimes(1);
    // Both clients subscribe to errors before connect() to avoid an
    // uncaughtException killing the process while reconnecting.
    expect(pubClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(subClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(createAdapterMock).toHaveBeenCalledWith(pubClient, subClient);
  });

  it('defaults to localhost when no config service is provided', async () => {
    const pubClient = makeRedisClient();
    pubClient.duplicate.mockReturnValue(makeRedisClient());
    createClientMock.mockReturnValue(pubClient as never);

    const adapter = new RedisIoAdapter({ app: true });
    await adapter.connectToRedis();

    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'redis://localhost:6379' }),
    );
  });

  it('caps the redis v5 reconnect backoff at 5s', async () => {
    const pubClient = makeRedisClient();
    pubClient.duplicate.mockReturnValue(makeRedisClient());
    createClientMock.mockReturnValue(pubClient as never);

    const adapter = createAdapter({ get: () => 'redis://localhost:6379' });
    await adapter.connectToRedis();

    const { reconnectStrategy } = (createClientMock.mock.calls[0][0] as {
      socket: { reconnectStrategy: (retries: number) => number };
    }).socket;
    expect(reconnectStrategy(1)).toBe(200);
    expect(reconnectStrategy(10)).toBe(2000);
    expect(reconnectStrategy(25)).toBe(5000);
    expect(reconnectStrategy(100)).toBe(5000);
  });

  it('logs errors reported by the pub and sub clients', async () => {
    const errorLogSpy = jest.spyOn(Logger.prototype, 'error');
    const pubClient = makeRedisClient();
    const subClient = makeRedisClient();
    pubClient.duplicate.mockReturnValue(subClient);
    createClientMock.mockReturnValue(pubClient as never);

    const adapter = createAdapter({ get: () => 'redis://localhost:6379' });
    await adapter.connectToRedis();

    const pubHandler = pubClient.on.mock.calls[0][1] as (err: Error) => void;
    const subHandler = subClient.on.mock.calls[0][1] as (err: Error) => void;
    expect(() => pubHandler(new Error('pub boom'))).not.toThrow();
    expect(() => subHandler(new Error('sub boom'))).not.toThrow();
    expect(errorLogSpy).toHaveBeenCalledWith('pubClient error: pub boom');
    expect(errorLogSpy).toHaveBeenCalledWith('subClient error: sub boom');
  });

  it('creates the socket.io server with websocket-only transport, ws CORS and the redis adapter', async () => {
    const pubClient = makeRedisClient();
    pubClient.duplicate.mockReturnValue(makeRedisClient());
    createClientMock.mockReturnValue(pubClient as never);
    const adapterConstructor = jest.fn();
    createAdapterMock.mockReturnValue(adapterConstructor as never);

    const previous = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'https://a.example.com, https://b.example.com';
    try {
      const adapter = createAdapter({ get: () => 'redis://localhost:6379' });
      await adapter.connectToRedis();

      const server = adapter.createIOServer(3000, {
        path: '/socket.io',
      } as never);

      expect(IoAdapter.prototype.createIOServer).toHaveBeenCalledWith(3000, {
        path: '/socket.io',
        transports: ['websocket'],
        cors: { origin: ['https://a.example.com', 'https://b.example.com'] },
      });
      expect(server).toBe(serverMock);
      expect(serverMock.adapter).toHaveBeenCalledWith(adapterConstructor);
    } finally {
      if (previous === undefined) {
        delete process.env.CORS_ORIGIN;
      } else {
        process.env.CORS_ORIGIN = previous;
      }
    }
  });
});
