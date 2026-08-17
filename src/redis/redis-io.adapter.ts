import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    private app: any,
    private configService?: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisUrl = this.configService?.get('REDIS_URL') || 'redis://localhost:6379';

    // 线性退避重连，封顶 5s
    const reconnectStrategy = (retries: number) => Math.min(retries * 200, 5000);
    const pubClient = createClient({ url: redisUrl, socket: { reconnectStrategy } });
    const subClient = pubClient.duplicate();

    // redis v4 client 是 EventEmitter，未监听的 'error' 事件会作为
    // uncaughtException 打挂进程；必须在 connect 之前注册
    pubClient.on('error', (err) => console.error('[RedisIoAdapter] pubClient error:', err));
    subClient.on('error', (err) => console.error('[RedisIoAdapter] subClient error:', err));

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      transports: ['websocket'],
      cors: { origin: process.env.CORS_ORIGIN || false },
    });
    server.adapter(this.adapterConstructor);
    return server;
  }
}
