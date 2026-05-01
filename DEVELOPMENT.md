# NightDeal 后端开发计划 — 阿瓦隆身份牌下发系统

## 1. 项目概述

### 1.1 产品定位

一款基于微信小程序的阿瓦隆（Avalon）桌游辅助工具，核心功能是：
- 房主创建房间，配置本局角色池
- 玩家扫码/链接加入房间
- 系统随机分配身份，玩家仅能查看自己的身份牌
- 实时同步房间状态（玩家加入/离开、游戏开始/结束）

### 1.2 技术栈选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 运行时 | Node.js 20 LTS | 异步 IO 适合高并发 WS |
| 框架 | NestJS | 模块化、TypeScript 原生支持、依赖注入 |
| WebSocket (服务端) | `@nestjs/websockets` + `socket.io` + `@socket.io/redis-adapter` | NestJS 原生集成，自动重连、房间广播，Redis Adapter 支持多实例扩展 |
| WebSocket (小程序端) | `weapp.socket.io` (v2.2.1+) | Socket.IO 客户端的小程序适配版，API 与 `socket.io-client` 一致 |
| 数据库 | PostgreSQL 16 + Prisma ORM | 关系型数据，Prisma 类型安全 |
| 缓存 | Redis | 会话存储、房间状态热数据 |
| 部署 | Docker + Docker Compose | 一键启动开发环境 |

### 1.3 微信小程序端信息

- AppID: `***REMOVED_APPID***`
- 渲染引擎: Skyline + glass-easel
- 语言: TypeScript

### 1.4 微信小程序 Socket.IO 兼容性说明

微信小程序**不支持**标准的 `socket.io-client` 包（浏览器环境依赖 XMLHttpRequest 等 API）。需要使用小程序适配版：

| 方案 | 包名 | Socket.IO 版本 | 说明 |
|------|------|---------------|------|
| **推荐** | `weapp.socket.io` | v3.x 兼容 | 社区维护，721+ stars，API 与 socket.io-client 一致，仅支持 websocket transport |
| 备选 | `@wxcloud/miniprogram-websocket-polyfill` | 通用 | 微信云官方方案，polyfill 浏览器 WebSocket 对象，需配合标准 socket.io-client 使用 |

**关键约束**：
- 小程序端**仅支持 websocket transport**，不支持 HTTP 长轮询。连接时必须指定 `transports: ['websocket']`
- 部分低版本微信客户端对 WebSocket 支持不稳定，Socket.IO 内置降级机制可保证兼容性
- 使用 `weapp.socket.io` 时，建议将构建后的 JS 文件直接放入小程序项目，而非通过 npm 构建

**小程序端连接示例**：
```typescript
// miniprogram/utils/socket.ts
const io = require('../libs/weapp.socket.io.js');

export function createSocket(token: string) {
  const socket = io('wss://your-domain.com/room', {
    transports: ['websocket'],  // 必须指定，小程序不支持 polling
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
  });

  return socket;
}
```

---

## 2. 数据库设计

### 2.1 ER 图概览

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │ 1───N │    Room      │ 1───N │  RoomPlayer  │
│─────────────│       │──────────────│       │──────────────│
│ id           │       │ id           │       │ id           │
│ openId       │       │ code         │       │ roomId       │
│ nickName     │       │ hostId       │       │ userId       │
│ avatarUrl    │       │ status       │       │ role         │
│ createdAt    │       │ roleConfig   │       │ seatNo       │
│ updatedAt    │       │ createdAt    │       │ joinedAt     │
└─────────────┘       │ updatedAt    │       └──────────────┘
                       └──────────────┘
                              │
                              │ 1───N
                       ┌──────────────┐
                       │ GameRecord   │
                       │──────────────│
                       │ id           │
                       │ roomId       │
                       │ roles        │  (JSON: 每个座位的角色)
                       │ startedAt    │
                       │ endedAt      │
                       └──────────────┘
```

### 2.2 表结构定义（Prisma Schema）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  openId    String   @unique
  nickName  String   @default("")
  avatarUrl String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  hostedRooms  Room[]       @relation("RoomHost")
  roomPlayers  RoomPlayer[]

  @@map("users")
}

model Room {
  id         String     @id @default(cuid())
  code       String     @unique @db.VarChar(6)   // 6位房间码
  hostId     String
  status     RoomStatus @default(WAITING)
  roleConfig Json       @default("{}")            // 角色配置 JSON
  maxPlayers Int        @default(10)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  host       User       @relation("RoomHost", fields: [hostId], references: [id])
  players    RoomPlayer[]
  games      GameRecord[]

  @@index([code])
  @@index([status])
  @@map("rooms")
}

model RoomPlayer {
  id        String   @id @default(cuid())
  roomId    String
  userId    String
  seatNo    Int      // 座位号，从 1 开始
  role      String?  // 分配的角色
  joinedAt  DateTime @default(now())

  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@unique([roomId, seatNo])
  @@index([userId])
  @@map("room_players")
}

model GameRecord {
  id        String   @id @default(cuid())
  roomId    String
  roles     Json     // { seatNo: roleName } 最终分配结果
  startedAt DateTime @default(now())
  endedAt   DateTime?

  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@map("game_records")
}

enum RoomStatus {
  WAITING    // 等待玩家加入
  PLAYING    // 游戏进行中
  FINISHED   // 已结束
}
```

### 2.3 roleConfig JSON Schema

`Room.roleConfig` 使用 Zod 在服务端做运行时校验：

```typescript
// src/room/role-config.schema.ts
import { z } from 'zod';

export const roleConfigSchema = z.object({
  merlin: z.boolean().default(false),
  percival: z.boolean().default(false),
  mordred: z.boolean().default(false),
  morgana: z.boolean().default(false),
  oberon: z.boolean().default(false),
  assassin: z.boolean().default(false),
  loyalServants: z.number().int().min(0).max(4).default(0),
  minions: z.number().int().min(0).max(4).default(0),
});

export type RoleConfig = z.infer<typeof roleConfigSchema>;
```

### 2.4 Redis 数据结构

Redis 用于存储高频读写的房间实时状态，数据库作为持久化。

```
# 房间热数据 (Hash)
room:{roomCode} -> {
  status: "WAITING",
  hostId: "user_xxx",
  playerCount: 5,
  maxPlayers: 10
}

# 房间玩家集合 (Set)
room:{roomCode}:players -> ["userId1", "userId2", ...]

# 离线玩家标记 (String, TTL 5min)
room:{roomCode}:offline:{userId} -> "1714000000000"  (断线时间戳)

# 用户所在的房间集合 (Set, TTL 24h，用于断线重连恢复)
user:{userId}:rooms -> ["roomCode1", "roomCode2", ...]

# 玩家会话 (String, TTL 2h)
session:{userId} -> { sessionKey }  // 仅供后端校验，禁止下发

# 房间码索引 (String, TTL 24h)
code:{roomCode} -> "roomId"
```

---

## 3. 微信登录对接

### 3.1 登录流程

```
小程序端                     后端                        微信服务器
   │                          │                            │
   │── wx.login() ──────────>│                            │
   │   返回 code              │                            │
   │                          │── code + appId + secret ──>│
   │                          │<── openId + sessionKey ────│
   │                          │                            │
   │                          │── 查/建 User ─────────────>│ DB
   │                          │── 生成自定义 token          │
   │                          │── 存入 Redis session       │
   │<── { token, userInfo } ─│                            │
   │                          │                            │
   │── 后续请求携带 token ───>│                            │
   │                          │── Redis 校验 token         │
```

### 3.2 后端 API 设计

```typescript
// POST /api/auth/login
// 请求体: { code: string }
// 响应:   { token: string, user: { id, nickName, avatarUrl } }

// POST /api/auth/update-profile
// 请求头: Authorization: Bearer <token>
// 请求体: { nickName: string, avatarUrl: string }
// 响应:   { user: { id, nickName, avatarUrl } }
```

### 3.3 关键实现

```typescript
// src/auth/auth.service.ts

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  async login(code: string): Promise<{ token: string; user: User }> {
    // 1. 用 code 换 openId
    const { openid, session_key } = await this.code2Session(code);

    // 2. 查找或创建用户
    const user = await this.prisma.user.upsert({
      where: { openId: openid },
      create: { openId: openid },
      update: {},
    });

    // 3. 生成自定义登录态 token
    const token = this.generateToken(user.id);

    // 4. 存入 Redis (TTL 2h)
    await this.redis.set(
      `session:${user.id}`,
      JSON.stringify({ userId: user.id, sessionKey: session_key }),
      'EX',
      7200,
    );

    return { token, user };
  }

  private async code2Session(code: string) {
    const appId = this.config.get('WX_APPID');
    const secret = this.config.get('WX_SECRET');
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }

    return data;
  }

  private generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, this.config.get('JWT_SECRET'), {
      expiresIn: '2h',
    });
  }

  async verifyToken(token: string): Promise<string | null> {
    try {
      const payload = jwt.verify(token, this.config.get('JWT_SECRET')) as { sub: string };
      // 双重校验：检查 Redis 中 session 是否存在
      const session = await this.redis.get(`session:${payload.sub}`);
      if (!session) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }
}
```

### 3.4 安全注意事项

- `session_key` 绝不可下发到小程序端
- `session_key` 存入 Redis 时应加密（使用 AES-256），避免 Redis 被攻破后泄露
- 自定义 token 使用 JWT + Redis 双重校验（JWT 验签 + Redis session 存在性检查）
- 敏感接口需校验用户身份与房间关系
- 房间码使用 `nanoid` 生成，6 位字母数字，创建时做唯一性检查，冲突则重新生成（最多重试 5 次）

---

## 4. WebSocket 实现

### 4.1 为什么用 WebSocket

阿瓦隆身份牌下发需要实时性：
- 玩家加入/离开时，房主和其他玩家立即看到
- 开始游戏时，所有玩家同时收到身份分配
- 长轮询无法保证实时性，且浪费资源

### 4.2 Socket.IO 事件设计

```
Client → Server:
─────────────────────────────────────────────────────────
  event              | payload                | 说明
─────────────────────────────────────────────────────────
  room:join          | { roomCode }                       | 加入房间
  room:leave         | { roomCode }                       | 离开房间
  room:start         | { roomCode }                       | 房主开始游戏（分配身份）
  room:kick          | { roomCode, targetUserId }         | 踢人（仅房主）
  player:update      | { nickName?, avatarUrl? }          | 更新玩家信息（昵称/头像）
─────────────────────────────────────────────────────────

Server → Client:
─────────────────────────────────────────────────────────
  event              | payload                                  | 说明
─────────────────────────────────────────────────────────
  room:player-joined | { player, playerCount }                  | 有人加入
  room:player-left   | { userId, playerCount }                  | 有人离开
  room:started       | { yourRole }                             | 游戏开始，单播自己的角色
  room:state         | { room, players }                        | 完整房间状态（加入时推送）
  room:offline       | { userId }                               | 某玩家断线
  room:reconnected   | { userId }                               | 某玩家重连
  player:updated     | { userId, nickName?, avatarUrl? }        | 某玩家更新了昵称/头像
  room:error         | { message }                              | 错误信息
─────────────────────────────────────────────────────────
```

### 4.3 Socket.IO Gateway 实现

#### 4.3.1 RoomService 接口定义

```typescript
// src/room/room.service.ts

export interface RoomInfo {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  roleConfig: RoleConfig;
  maxPlayers: number;
}

export interface PlayerInfo {
  id: string;
  userId: string;
  seatNo: number;
  role?: string;
  isOnline: boolean;
  user: { id: string; nickName: string; avatarUrl: string };
}

export interface JoinResult {
  roomState: { room: RoomInfo; players: PlayerInfo[] };
  player: PlayerInfo;
  playerCount: number;
}

export interface StartResult {
  assignments: { userId: string; seatNo: number; role: string; team: string }[];
}

@Injectable()
export class RoomService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /** 获取房间信息（优先 Redis，降级 DB） */
  async getRoom(roomCode: string): Promise<RoomInfo | null> { ... }

  /** 获取房间内玩家列表 */
  async getPlayers(roomCode: string): Promise<PlayerInfo[]> { ... }

  /** 获取房间玩家数量 */
  async getPlayerCount(roomCode: string): Promise<number> { ... }

  /** 获取指定玩家信息 */
  async getPlayer(roomCode: string, userId: string): Promise<PlayerInfo | null> { ... }

  /** 加入房间（自动分配座位号，使用数据库事务保证唯一性） */
  async joinRoom(roomCode: string, userId: string): Promise<JoinResult | { error: string }> { ... }

  /** 离开房间 */
  async leaveRoom(roomCode: string, userId: string): Promise<void> { ... }

  /** 踢出玩家（仅房主可操作） */
  async kickPlayer(roomCode: string, hostId: string, targetUserId: string): Promise<void | { error: string }> { ... }

  /** 开始游戏（分配角色，更新 DB，返回分配结果） */
  async startGame(roomCode: string, hostId: string): Promise<StartResult | { error: string }> { ... }

  /** 获取用户所在的所有房间（用于断线重连） */
  async getUserRooms(userId: string): Promise<string[]> { ... }

  /** 标记玩家离线（不移除，设置超时） */
  async markPlayerOffline(roomCode: string, userId: string): Promise<void> { ... }

  /** 标记玩家上线（重连时调用） */
  async markPlayerOnline(roomCode: string, userId: string): Promise<void> { ... }

  /** 获取玩家自己的角色（重连时使用） */
  async getPlayerRole(roomCode: string, userId: string): Promise<string | null> { ... }

  /** 清理超时离线的玩家（定时任务调用，超时阈值 5 分钟） */
  async cleanupOfflinePlayers(): Promise<void> { ... }
}
```

#### 4.3.2 座位号分配策略

加入房间时自动分配座位号，规则：
1. 查找当前房间已占用的座位号集合
2. 从 1 到 `maxPlayers` 中找到最小的未占用座位号
3. 使用数据库事务 + 唯一约束防止并发冲突，冲突时重试（最多 3 次）

```typescript
// src/room/seat-assigner.ts

export async function assignSeat(
  prisma: PrismaService,
  roomId: string,
  maxPlayers: number,
): Promise<number> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const occupiedSeats = await prisma.roomPlayer.findMany({
      where: { roomId },
      select: { seatNo: true },
      orderBy: { seatNo: 'asc' },
    });

    const occupiedSet = new Set(occupiedSeats.map((s) => s.seatNo));
    let seatNo = 1;
    while (seatNo <= maxPlayers && occupiedSet.has(seatNo)) {
      seatNo++;
    }

    if (seatNo > maxPlayers) {
      throw new Error('房间已满');
    }

    try {
      await prisma.roomPlayer.create({
        data: { roomId, seatNo, userId: '' }, // userId 由调用方填充
      });
      return seatNo;
    } catch (e) {
      if (e.code === 'P2002') continue; // 唯一约束冲突，重试
      throw e;
    }
  }
  throw new Error('座位分配失败，请重试');
}
```

#### 4.3.3 断线重连机制

**设计原则**：断线 ≠ 离开。断线后保留座位和角色，设置 5 分钟超时。

```
断线流程：
  1. 客户端断线 → handleDisconnect 触发
  2. 标记玩家为 offline（Redis: room:{code}:offline:{userId} = timestamp, TTL 5min）
  3. 广播 room:offline 给房间内其他玩家
  4. 5 分钟内重连 → 恢复状态，广播 room:reconnected
  5. 超时未重连 → 清理离线标记，从房间移除，广播 room:player-left

重连流程：
  1. 客户端重新建立 Socket.IO 连接（自动携带 auth token）
  2. handleConnection 验证 token，标记 userId
  3. 客户端发送 room:join（带上 roomCode）
  4. 服务端检测到该用户已有离线标记 → 走重连逻辑而非新加入
  5. 清除离线标记，推送最新房间状态 + 自己的角色
  6. 广播 room:reconnected 给其他玩家
```

#### 4.3.4 Gateway 完整实现

```typescript
// src/room/room.gateway.ts

import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { AuthService } from '../auth/auth.service';
import { JoinRoomDto, LeaveRoomDto, StartGameDto, KickPlayerDto } from './dto';

const OFFLINE_TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || '*' },  // 生产环境应限制域名
  namespace: '/room',
})
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId → socketId 映射（用于断线重连时找到对应 socket）
  private userSocketMap = new Map<string, string>();

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    // 兼容两种 token 注入方式：
    //   1) Socket.IO 标准 `auth: { token }`（推荐）
    //   2) 引擎握手 query string `?token=...`（小程序自实现 Socket.IO 协议时的兜底）
    const authToken = client.handshake.auth?.token;
    const queryTokenRaw = client.handshake.query?.token;
    const queryToken = Array.isArray(queryTokenRaw) ? queryTokenRaw[0] : queryTokenRaw;
    const token =
      (typeof authToken === 'string' && authToken.trim()) ||
      (typeof queryToken === 'string' && queryToken.trim()) ||
      undefined;
    if (!token) {
      client.emit('room:error', { message: '未登录' });
      client.disconnect();
      return;
    }
    const userId = await this.authService.verifyToken(token);
    if (!userId) {
      client.emit('room:error', { message: '登录态失效' });
      client.disconnect();
      return;
    }
    client.data.userId = userId;
    this.userSocketMap.set(userId, client.id);
  }

  @SubscribeMessage('room:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    const userId = client.data.userId;

    // 检查房间是否存在
    const room = await this.roomService.getRoom(payload.roomCode);
    if (!room) {
      client.emit('room:error', { message: '房间不存在' });
      return;
    }

    // 检查房间状态
    if (room.status === 'FINISHED') {
      client.emit('room:error', { message: '房间已结束' });
      return;
    }

    // 检查是否是断线重连（玩家已存在但标记为离线）
    const existingPlayer = await this.roomService.getPlayer(payload.roomCode, userId);
    if (existingPlayer && !existingPlayer.isOnline) {
      // 重连逻辑
      await this.roomService.markPlayerOnline(payload.roomCode, userId);
      client.join(payload.roomCode);

      const players = await this.roomService.getPlayers(payload.roomCode);
      const roomState = { room, players };
      client.emit('room:state', roomState);

      // 如果游戏已开始，推送该玩家的角色
      if (room.status === 'PLAYING' && existingPlayer.role) {
        client.emit('room:started', { yourRole: existingPlayer.role });
      }

      client.to(payload.roomCode).emit('room:reconnected', { userId });
      return;
    }

    if (existingPlayer) {
      client.emit('room:error', { message: '你已在房间中' });
      return;
    }

    // 游戏进行中不允许新玩家加入
    if (room.status === 'PLAYING') {
      client.emit('room:error', { message: '游戏已开始，无法加入' });
      return;
    }

    // 检查房间是否已满
    const playerCount = await this.roomService.getPlayerCount(payload.roomCode);
    if (playerCount >= room.maxPlayers) {
      client.emit('room:error', { message: '房间已满' });
      return;
    }

    const result = await this.roomService.joinRoom(payload.roomCode, userId);

    if ('error' in result) {
      client.emit('room:error', { message: result.error });
      return;
    }

    client.join(payload.roomCode);
    client.emit('room:state', result.roomState);
    client.to(payload.roomCode).emit('room:player-joined', {
      player: result.player,
      playerCount: result.playerCount,
    });
  }

  @SubscribeMessage('room:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomDto,
  ) {
    const userId = client.data.userId;
    await this.roomService.leaveRoom(payload.roomCode, userId);
    client.leave(payload.roomCode);
    client.to(payload.roomCode).emit('room:player-left', {
      userId,
      playerCount: await this.roomService.getPlayerCount(payload.roomCode),
    });
  }

  @SubscribeMessage('room:kick')
  async handleKick(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: KickPlayerDto,
  ) {
    const userId = client.data.userId;
    const result = await this.roomService.kickPlayer(
      payload.roomCode,
      userId,
      payload.targetUserId,
    );

    if ('error' in result) {
      client.emit('room:error', { message: result.error });
      return;
    }

    // 通知被踢玩家
    const targetSocketId = this.userSocketMap.get(payload.targetUserId);
    if (targetSocketId) {
      const targetSocket = this.server.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('room:error', { message: '你已被房主踢出房间' });
        targetSocket.leave(payload.roomCode);
      }
    }

    // 广播给房间内其他人
    client.to(payload.roomCode).emit('room:player-left', {
      userId: payload.targetUserId,
      playerCount: await this.roomService.getPlayerCount(payload.roomCode),
    });
  }

  @SubscribeMessage('room:start')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartGameDto,
  ) {
    const userId = client.data.userId;
    const result = await this.roomService.startGame(payload.roomCode, userId);

    if ('error' in result) {
      client.emit('room:error', { message: result.error });
      return;
    }

    // 给每个玩家单独推送其角色（隐私保护）
    for (const assignment of result.assignments) {
      const socketId = this.userSocketMap.get(assignment.userId);
      if (socketId) {
        const target = this.server.sockets.sockets.get(socketId);
        target?.emit('room:started', { yourRole: assignment.role });
      }
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    this.userSocketMap.delete(userId);

    // 获取用户所在的所有房间
    const rooms = await this.roomService.getUserRooms(userId);

    for (const roomCode of rooms) {
      // 标记为离线（不立即移除）
      await this.roomService.markPlayerOffline(roomCode, userId);

      // 广播离线状态
      client.to(roomCode).emit('room:offline', { userId });

      // 设置超时清理（5 分钟后仍未重连则移除）
      setTimeout(async () => {
        const player = await this.roomService.getPlayer(roomCode, userId);
        if (player && !player.isOnline) {
          await this.roomService.leaveRoom(roomCode, userId);
          this.server.to(roomCode).emit('room:player-left', {
            userId,
            playerCount: await this.roomService.getPlayerCount(roomCode),
          });
        }
      }, OFFLINE_TIMEOUT_MS);
    }
  }
}
```

#### 4.3.5 WebSocket DTO（消息校验）

```typescript
// src/room/dto/index.ts
import { IsString, Length, Matches } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Za-z0-9]{6}$/, { message: '房间码格式无效' })
  roomCode: string;
}

export class LeaveRoomDto {
  @IsString()
  @Length(6, 6)
  roomCode: string;
}

export class StartGameDto {
  @IsString()
  @Length(6, 6)
  roomCode: string;
}

export class KickPlayerDto {
  @IsString()
  @Length(6, 6)
  roomCode: string;

  @IsString()
  targetUserId: string;
}
```

### 4.4 角色分配算法

```typescript
// src/room/role-assigner.ts

export interface AvalonRoleConfig {
  merlin: boolean;        // 梅林
  percival: boolean;      // 派西维尔
  mordred: boolean;       // 莫德雷德
  morgana: boolean;       // 莫甘娜
  oberon: boolean;        // 奥伯伦
  assassin: boolean;      // 刺客
  loyalServants: number;  // 忠臣数量
  minions: number;        // 爪牙数量
}

export interface RoleAssignment {
  seatNo: number;
  userId: string;
  role: string;
  team: 'good' | 'evil';
}

export function assignRoles(
  players: { seatNo: number; userId: string }[],
  config: AvalonRoleConfig,
): RoleAssignment[] {
  const rolePool: { role: string; team: 'good' | 'evil' }[] = [];

  if (config.merlin) rolePool.push({ role: '梅林', team: 'good' });
  if (config.percival) rolePool.push({ role: '派西维尔', team: 'good' });
  if (config.mordred) rolePool.push({ role: '莫德雷德', team: 'evil' });
  if (config.morgana) rolePool.push({ role: '莫甘娜', team: 'evil' });
  if (config.oberon) rolePool.push({ role: '奥伯伦', team: 'evil' });
  if (config.assassin) rolePool.push({ role: '刺客', team: 'evil' });

  for (let i = 0; i < config.loyalServants; i++) {
    rolePool.push({ role: '忠臣', team: 'good' });
  }
  for (let i = 0; i < config.minions; i++) {
    rolePool.push({ role: '爪牙', team: 'evil' });
  }

  if (rolePool.length !== players.length) {
    throw new Error('角色数量与玩家数量不匹配');
  }

  // Fisher-Yates 洗牌
  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
  }

  return players.map((player, idx) => ({
    seatNo: player.seatNo,
    userId: player.userId,
    role: rolePool[idx].role,
    team: rolePool[idx].team,
  }));
}
```

#### 4.4.1 角色分配后的数据库持久化

`startGame` 方法在调用 `assignRoles` 后，必须将结果写入数据库，以便断线重连时恢复角色：

```typescript
// src/room/room.service.ts (startGame 方法核心逻辑)

async startGame(roomCode: string, hostId: string): Promise<StartResult | { error: string }> {
  const room = await this.getRoom(roomCode);
  if (!room) return { error: '房间不存在' };
  if (room.hostId !== hostId) return { error: '仅房主可以开始游戏' };
  if (room.status !== 'WAITING') return { error: '游戏已开始' };

  const players = await this.getPlayers(roomCode);
  if (players.length < 5) return { error: '至少需要 5 名玩家' };

  // 校验角色配置与玩家数量匹配
  const config = roleConfigSchema.parse(room.roleConfig);
  const totalRoles = (config.merlin ? 1 : 0) + (config.percival ? 1 : 0)
    + (config.mordred ? 1 : 0) + (config.morgana ? 1 : 0)
    + (config.oberon ? 1 : 0) + (config.assassin ? 1 : 0)
    + config.loyalServants + config.minions;
  if (totalRoles !== players.length) {
    return { error: `角色总数(${totalRoles})与玩家数(${players.length})不匹配` };
  }

  // 分配角色
  const assignments = assignRoles(
    players.map((p) => ({ seatNo: p.seatNo, userId: p.userId })),
    config,
  );

  // 使用事务更新数据库
  await this.prisma.$transaction(async (tx) => {
    // 更新每个玩家的角色
    for (const assignment of assignments) {
      await tx.roomPlayer.updateMany({
        where: { roomId: room.id, userId: assignment.userId },
        data: { role: assignment.role },
      });
    }

    // 更新房间状态
    await tx.room.update({
      where: { id: room.id },
      data: { status: 'PLAYING' },
    });

    // 创建游戏记录
    await tx.gameRecord.create({
      data: {
        roomId: room.id,
        roles: Object.fromEntries(
          assignments.map((a) => [a.seatNo, a.role])
        ),
      },
    });
  });

  // 更新 Redis 缓存
  await this.redis.hset(`room:${roomCode}`, 'status', 'PLAYING');

  return { assignments };
}
```

---

## 5. 项目结构

```
nightdeal-backend/
├── docker-compose.yml          # PostgreSQL + Redis
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
├── nest-cli.json
├── prisma/
│   └── schema.prisma           # 数据库 Schema
└── src/
    ├── main.ts                 # 入口（注册 RedisIoAdapter）
    ├── app.module.ts           # 根模块
    ├── common/
    │   ├── guards/
    │   │   └── ws-jwt.guard.ts
    │   ├── interceptors/
    │   │   └── transform.interceptor.ts
    │   └── filters/
    │       └── ws-exception.filter.ts
    ├── config/
    │   └── config.module.ts
    ├── prisma/
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    ├── redis/
    │   ├── redis.module.ts
    │   ├── redis.service.ts
    │   └── redis-io.adapter.ts  # Socket.IO Redis Adapter（多实例扩展）
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.guard.ts
    └── room/
        ├── room.module.ts
        ├── room.controller.ts
        ├── room.service.ts
        ├── room.gateway.ts
        ├── role-assigner.ts
        ├── seat-assigner.ts
        └── dto/
            └── index.ts        # WebSocket 消息校验 DTO
```

---

## 6. 核心 API 清单

### 6.1 REST 接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/login` | 微信登录 | 否 |
| POST | `/api/auth/update-profile` | 更新头像昵称 | 是 |
| POST | `/api/auth/avatar/credential` | 获取阿里云 OSS PostObject 直传凭证 | 是 |
| POST | `/api/auth/avatar/upload` | 服务端压缩并上传头像（multipart `avatar` 字段） | 是 |
| POST | `/api/rooms` | 创建房间 | 是 |
| GET | `/api/rooms/:code` | 获取房间信息 | 是 |
| POST | `/api/rooms/:code/join` | 加入房间（REST 入口，房间页 Socket 进房前可使用） | 是 |
| POST | `/api/rooms/:code/start` | 房主开始游戏（与 `room:start` Socket 事件等效） | 是 |
| POST | `/api/rooms/:code/kick` | 房主踢人（与 `room:kick` Socket 事件等效），body：`{ userId }` | 是 |
| GET | `/api/rooms/:code/my-role` | 获取自己的角色（游戏开始后，断线重连用） | 是 |
| GET | `/api/health` | 健康检查（DB / Redis 连通性） | 否 |

> 头像上传双通道并存：`/auth/avatar/credential` 适用于小程序直传 OSS（PostObject 协议）；`/auth/avatar/upload` 适用于服务端压缩+OSS 上传，前端可二选一。当前小程序端默认使用 `/auth/avatar/upload`。

### 6.2 WebSocket 事件

见第 4.2 节。

---

## 7. 开发阶段划分

### Phase 1: 基础设施（1-2 天）

- [ ] 初始化 NestJS 项目
- [ ] Docker Compose 配置 PostgreSQL + Redis
- [ ] Prisma Schema 迁移
- [ ] 全局异常过滤器、响应拦截器
- [ ] JWT 鉴权守卫（HTTP + WebSocket）
- [ ] Redis IO Adapter 配置（Socket.IO 多实例支持）

### Phase 2: 微信登录（1 天）

- [ ] `POST /api/auth/login` — code 换 token
- [ ] `POST /api/auth/update-profile` — 更新用户信息
- [ ] Redis session 管理（加密存储 session_key）
- [ ] `verifyToken` 方法实现（JWT + Redis 双重校验）

### Phase 3: 房间管理（2 天）

- [ ] `POST /api/rooms` — 创建房间，生成 6 位房间码（nanoid + 唯一性重试）
- [ ] `GET /api/rooms/:code` — 查询房间信息
- [ ] WebSocket Gateway 基础框架 + DTO 校验
- [ ] `room:join` / `room:leave` 事件处理
- [ ] 座位号自动分配（事务 + 唯一约束防并发冲突）
- [ ] 房间状态 Redis 缓存

### Phase 4: 身份牌下发（1-2 天）

- [ ] 角色配置校验（人数 vs 角色数，Zod 运行时校验）
- [ ] Fisher-Yates 洗牌分配
- [ ] `room:start` 事件 — 单播推送角色
- [ ] 游戏记录持久化（更新 RoomPlayer.role + 创建 GameRecord，使用事务）
- [ ] `GET /api/rooms/:code/my-role` 断线重连角色查询接口

### Phase 5: 完善与部署（3-4 天）

- [ ] 房主踢人功能
- [ ] 断线重连处理（离线标记 + 5 分钟超时 + 重连恢复 + Redis 状态管理）
- [ ] 房间超时自动销毁（30 分钟无操作，用 Redis TTL + 定时任务）
- [ ] Dockerfile 多阶段构建
- [ ] 接口文档（Swagger / `@nestjs/swagger`）
- [ ] 健康检查端点 `GET /api/health`
- [ ] 接口限频（`@nestjs/throttler`，登录接口 10 次/分钟）
- [ ] Socket.IO Redis Adapter 配置（支持多实例扩展）

**总预计工时**：后端 8-11 天，小程序端 4-5 天（可并行开发）

---

## 8. 微信小程序端开发计划

### 8.1 项目结构

```
nightdeal-minip/miniprogram/
├── app.ts                    # 入口（全局 Socket 连接管理）
├── app.json                  # 页面路由、窗口配置
├── app.wxss                  # 全局样式
├── libs/
│   └── weapp.socket.io.js    # Socket.IO 小程序适配库（从 GitHub 构建）
├── utils/
│   ├── socket.ts             # Socket 连接管理（单例）
│   ├── request.ts            # HTTP 请求封装（带 token）
│   └── storage.ts            # 本地存储封装
├── components/
│   ├── navigation-bar/       # 自定义导航栏
│   ├── role-card/            # 角色牌组件（翻牌动画）
│   └── player-list/          # 玩家列表组件
└── pages/
    ├── index/                # 首页（创建/加入房间）
    ├── room/                 # 房间页（等待、玩家列表、开始游戏）
    └── game/                 # 游戏页（查看角色）
```

### 8.2 页面设计

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `/pages/index/index` | 微信登录、创建房间、扫码/输入房间码加入 |
| 房间页 | `/pages/room/room` | 玩家列表、座位号、房主踢人、开始游戏 |
| 游戏页 | `/pages/game/game` | 翻牌查看角色、显示所有玩家（隐藏角色） |

### 8.3 Socket 连接管理

```typescript
// miniprogram/utils/socket.ts
const io = require('../libs/weapp.socket.io.js');

let socket: any = null;

export function connectSocket(token: string) {
  if (socket?.connected) return socket;

  socket = io('wss://your-domain.com/room', {
    transports: ['websocket'],  // 必须指定
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[Socket] 已连接:', socket.id);
  });

  socket.on('disconnect', (reason: string) => {
    console.log('[Socket] 断开:', reason);
    if (reason === 'io server disconnect') {
      socket.connect(); // 服务端主动断开时重连
    }
  });

  socket.on('connect_error', (err: Error) => {
    console.error('[Socket] 连接错误:', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

### 8.4 开发阶段

| 阶段 | 内容 | 预计工时 |
|------|------|----------|
| Phase M1 | 登录页 + 微信登录 + HTTP 请求封装 | 0.5 天 |
| Phase M2 | 首页（创建房间 + 加入房间） | 0.5 天 |
| Phase M3 | 房间页（Socket 连接、玩家列表、实时更新） | 1 天 |
| Phase M4 | 游戏页（翻牌动画、角色展示） | 1 天 |
| Phase M5 | 联调、样式优化、异常处理 | 1 天 |

### 8.5 微信小程序配置要求

- 在 [微信公众平台](https://mp.weixin.qq.com) → 开发管理 → 服务器域名 中添加：
  - `socket` 域名：`wss://your-domain.com`
  - `request` 域名：`https://your-domain.com`
- 开发阶段可在微信开发者工具中勾选「不校验合法域名」

---

## 9. 环境变量

```bash
# .env.example

PORT=3000
DATABASE_URL=postgresql://nightdeal:nightdeal@localhost:5432/nightdeal
REDIS_URL=redis://localhost:6379
WX_APPID=***REMOVED_APPID***
WX_SECRET=your_wx_secret_here
JWT_SECRET=your_jwt_secret_here
```

---

## 10. Docker Compose（开发环境）

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./src:/app/src  # 开发时热重载

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: nightdeal
      POSTGRES_PASSWORD: nightdeal
      POSTGRES_DB: nightdeal
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U nightdeal']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redisdata:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

---

## 11. 阿瓦隆角色速查

| 角色 | 阵营 | 特殊能力 |
|------|------|----------|
| 梅林 | 好人 | 知道所有坏人是谁 |
| 派西维尔 | 好人 | 知道谁是梅林 |
| 忠臣 | 好人 | 无特殊能力 |
| 莫德雷德 | 坏人 | 梅林看不到他 |
| 莫甘娜 | 坏人 | 假装自己是梅林 |
| 刺客 | 坏人 | 游戏结束后可刺杀梅林 |
| 奥伯伦 | 坏人 | 不知道队友是谁 |
| 爪牙 | 坏人 | 知道其他坏人（除奥伯伦） |

### 默认角色配置（5-10 人）

| 人数 | 好人 | 坏人 | 推荐配置 |
|------|------|------|----------|
| 5  | 3 | 2 | 梅林、派西维尔、忠臣 vs 刺客、莫甘娜 |
| 6  | 4 | 2 | +忠臣 |
| 7  | 4 | 3 | +爪牙 |
| 8  | 5 | 3 | +忠臣 |
| 9  | 6 | 3 | +忠臣 |
| 10 | 6 | 4 | +莫德雷德、奥伯伦 |

---

## 12. 安全要求

- `session_key` 禁止下发到客户端，存入 Redis 时应加密（AES-256）
- 角色分配后仅通过单播推送给对应玩家，不广播
- 房间码使用 `nanoid` 生成（密码学安全），创建时做唯一性重试（最多 5 次）
- WebSocket 连接必须携带有效 JWT（通过 `WsAuthGuard` 校验）
- 敏感操作（开始游戏、踢人）校验房主身份
- 登录接口限频：10 次/分钟/IP（`@nestjs/throttler`）
- roleConfig 在服务端用 Zod 校验，拒绝非法配置
- WebSocket 消息体使用 `class-validator` DTO 校验（`@UsePipes(new ValidationPipe())`）
- 结构化日志（pino），生产环境 JSON 格式输出
- 健康检查端点 `GET /api/health` 返回 DB/Redis 连接状态
- **并发控制**：房间加入/踢人等操作使用数据库事务 + 唯一约束防止竞态条件
- **座位号分配**：使用事务 + 重试机制处理并发冲突（P2002 错误码）

---

## 13. 测试策略

### 13.1 测试框架

| 类型 | 工具 | 用途 |
|------|------|------|
| 单元测试 | Jest | 测试独立函数和类 |
| 集成测试 | Jest + Supertest | 测试API端点和数据库交互 |
| WebSocket测试 | Socket.IO Client | 测试实时通信流程 |
| E2E测试 | Playwright | 模拟完整用户流程 |
| 性能测试 | Artillery | 负载测试和压力测试 |

### 13.2 单元测试

**测试文件结构**：
```
src/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts      # 单元测试
├── room/
│   ├── room.service.ts
│   ├── room.service.spec.ts
│   ├── role-assigner.ts
│   └── role-assigner.spec.ts     # 角色分配算法测试
└── common/
    └── guards/
        └── ws-jwt.guard.spec.ts
```

**关键测试用例**：

```typescript
// src/room/role-assigner.spec.ts
describe('RoleAssigner', () => {
  describe('assignRoles', () => {
    it('should throw error when role count mismatch player count', () => {
      const players = [{ seatNo: 1, userId: 'user1' }];
      const config = { merlin: true, percival: true, loyalServants: 0, minions: 0 };
      
      expect(() => assignRoles(players, config)).toThrow('角色数量与玩家数量不匹配');
    });

    it('should assign roles correctly for 5 players', () => {
      const players = [
        { seatNo: 1, userId: 'user1' },
        { seatNo: 2, userId: 'user2' },
        { seatNo: 3, userId: 'user3' },
        { seatNo: 4, userId: 'user4' },
        { seatNo: 5, userId: 'user5' },
      ];
      const config = {
        merlin: true,
        percival: true,
        mordred: false,
        morgana: true,
        oberon: false,
        assassin: true,
        loyalServants: 1,
        minions: 0,
      };

      const result = assignRoles(players, config);

      expect(result).toHaveLength(5);
      expect(result.filter(r => r.team === 'good')).toHaveLength(3);
      expect(result.filter(r => r.team === 'evil')).toHaveLength(2);
    });

    it('should shuffle roles randomly', () => {
      const players = Array.from({ length: 5 }, (_, i) => ({
        seatNo: i + 1,
        userId: `user${i + 1}`,
      }));
      const config = {
        merlin: true,
        percival: true,
        morgana: true,
        assassin: true,
        loyalServants: 1,
      };

      // 运行多次，验证随机性
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        const result = assignRoles(players, config);
        results.add(result.map(r => r.role).join(','));
      }

      // 100次运行应该产生多种不同的分配结果
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
```

**覆盖率目标**：
- 整体覆盖率：80%+
- 核心模块（auth、room）：90%+
- 角色分配算法：100%

### 13.3 集成测试

**数据库测试**（使用Testcontainers）：

```typescript
// test/integration/room.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Room Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/rooms', () => {
    it('should create a room with valid token', async () => {
      // 先登录获取token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ code: 'test_code' });

      const { token } = loginResponse.body;

      // 创建房间
      const response = await request(app.getHttpServer())
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({
          roleConfig: {
            merlin: true,
            percival: true,
            loyalServants: 3,
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toHaveLength(6);
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .post('/api/rooms')
        .send({})
        .expect(401);
    });
  });
});
```

### 13.4 WebSocket测试

```typescript
// test/integration/websocket.integration.spec.ts
import { io, Socket } from 'socket.io-client';

describe('WebSocket Integration', () => {
  let clientSocket: Socket;
  const SERVER_URL = 'http://localhost:3000/room';

  beforeEach((done) => {
    clientSocket = io(SERVER_URL, {
      auth: { token: 'valid_jwt_token' },
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.disconnect();
  });

  it('should receive error when joining non-existent room', (done) => {
    clientSocket.emit('room:join', { roomCode: 'INVALID' });
    
    clientSocket.on('room:error', (data) => {
      expect(data.message).toBe('房间不存在');
      done();
    });
  });

  it('should broadcast player joined event', (done) => {
    const roomCode = 'TEST01';
    
    // 第一个客户端加入房间
    clientSocket.emit('room:join', { roomCode });
    
    // 第二个客户端监听加入事件
    const secondClient = io(SERVER_URL, {
      auth: { token: 'another_jwt_token' },
    });
    
    secondClient.on('connect', () => {
      secondClient.emit('room:join', { roomCode });
    });
    
    clientSocket.on('room:player-joined', (data) => {
      expect(data).toHaveProperty('player');
      expect(data).toHaveProperty('playerCount');
      secondClient.disconnect();
      done();
    });
  });
});
```

### 13.5 性能测试

**Artillery配置** (`test/performance/load-test.yml`):

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: "Room creation and joining flow"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            code: "{{ $randomString() }}"
          capture:
            - json: "$.token"
              as: "token"
      - post:
          url: "/api/rooms"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            roleConfig:
              merlin: true
              percival: true
              loyalServants: 3
          capture:
            - json: "$.code"
              as: "roomCode"
      - get:
          url: "/api/rooms/{{ roomCode }}"
          headers:
            Authorization: "Bearer {{ token }}"
```

**性能指标目标**：
- 响应时间：P95 < 200ms
- 错误率：< 1%
- WebSocket连接数：支持1000+并发
- 房间创建：50次/秒

### 13.6 测试运行命令

```bash
# 单元测试
npm run test

# 集成测试
npm run test:integration

# E2E测试
npm run test:e2e

# 覆盖率报告
npm run test:cov

# 性能测试
npm run test:performance

# 所有测试
npm run test:all
```

**package.json测试脚本**：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:integration": "jest --config ./test/jest-integration.json",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:performance": "artillery run test/performance/load-test.yml",
    "test:all": "npm run test && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 14. 部署指南

### 14.1 生产环境要求

| 组件 | 版本 | 最低配置 |
|------|------|----------|
| Node.js | 20 LTS | 2核4G |
| PostgreSQL | 16 | 2核4G，100G SSD |
| Redis | 7 | 1核2G |
| Docker | 24+ | - |
| Docker Compose | 2.20+ | - |

### 14.2 环境变量配置

**生产环境** (`.env.production`):

```bash
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库（使用连接池）
DATABASE_URL=postgresql://user:password@db-host:5432/nightdeal?connection_limit=20&pool_timeout=30

# Redis（使用密码和TLS）
REDIS_URL=redis://:password@redis-host:6379?tls=true

# 微信小程序（从密钥管理服务获取）
WX_APPID=***REMOVED_APPID***
WX_SECRET=${WX_SECRET}  # 从环境变量或密钥管理服务读取

# JWT（使用强密钥，至少32字符）
JWT_SECRET=${JWT_SECRET}  # 从环境变量或密钥管理服务读取
JWT_EXPIRES_IN=2h

# CORS（生产环境限制域名）
CORS_ORIGIN=https://your-domain.com

# 日志
LOG_LEVEL=info
LOG_FORMAT=json

# 限流
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

**密钥管理**：

```typescript
// src/config/config.module.ts
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        WX_APPID: Joi.string().required(),
        WX_SECRET: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('2h'),
        CORS_ORIGIN: Joi.string().default('*'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
})
export class AppConfigModule {}
```

### 14.3 Docker配置

**生产环境Dockerfile** (`Dockerfile`):

```dockerfile
# 多阶段构建
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 安全：创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 复制构建产物
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 切换到非root用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main.js"]
```

**生产环境Docker Compose** (`docker-compose.prod.yml`):

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - '3000:3000'
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    networks:
      - nightdeal-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    networks:
      - nightdeal-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '--no-auth-warning', '-a', '${REDIS_PASSWORD}', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
    networks:
      - nightdeal-network

  # 反向代理（可选）
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - nightdeal-network

volumes:
  postgres-data:
  redis-data:

networks:
  nightdeal-network:
    driver: bridge
```

### 14.4 Nginx配置

**nginx.conf**:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # 限流区域定义（必须在 http 块内，不能在 server 块内）
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # WebSocket升级映射
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    server {
        listen 80;
        server_name your-domain.com;
        
        # 重定向到HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL证书
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # 登录接口限流
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API代理（通用限流）
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket代理（无限流，需要长连接）
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # WebSocket超时设置
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # 健康检查
        location /api/health {
            proxy_pass http://app;
            access_log off;
        }
    }
}
```

### 14.5 部署步骤

**1. 准备服务器**：

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建部署目录
sudo mkdir -p /opt/nightdeal
sudo chown $USER:$USER /opt/nightdeal
```

**2. 配置环境变量**：

```bash
cd /opt/nightdeal

# 创建环境变量文件
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://nightdeal:$(openssl rand -base64 32)@postgres:5432/nightdeal
REDIS_URL=redis://:$(openssl rand -base64 32)@redis:6379
WX_APPID=***REMOVED_APPID***
WX_SECRET=your_wx_secret_here
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=2h
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=info
LOG_FORMAT=json
DB_USER=nightdeal
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=nightdeal
REDIS_PASSWORD=$(openssl rand -base64 32)
EOF

# 设置权限
chmod 600 .env.production
```

**3. 部署应用**：

```bash
# 拉取代码
git clone https://github.com/your-repo/nightdeal-backend.git .
git checkout main

# 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 运行数据库迁移
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f app
```

**4. 配置SSL证书**：

```bash
# 使用Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到nginx目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# 重启nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### 14.6 监控和日志

**Prometheus配置** (`prometheus.yml`):

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'nightdeal'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/metrics'
```

**Grafana仪表板**：

```json
{
  "dashboard": {
    "title": "NightDeal监控",
    "panels": [
      {
        "title": "活跃房间数",
        "type": "stat",
        "targets": [{
          "expr": "nightdeal_rooms_active"
        }]
      },
      {
        "title": "WebSocket连接数",
        "type": "stat",
        "targets": [{
          "expr": "nightdeal_ws_connections"
        }]
      },
      {
        "title": "API响应时间",
        "type": "graph",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(nightdeal_http_duration_seconds_bucket[5m]))"
        }]
      }
    ]
  }
}
```

**日志收集**（使用Loki）：

```yaml
# docker-compose.prod.yml添加
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki
    networks:
      - nightdeal-network

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
    networks:
      - nightdeal-network
```

**应用指标暴露**：

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { RedisIoAdapter } from './redis/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // 注册 Redis Adapter（支持 Socket.IO 多实例扩展）
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  
  app.useLogger(app.get(Logger));
  
  // 启用CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // 全局前缀
  app.setGlobalPrefix('api');
  
  await app.listen(process.env.PORT || 3000);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

### 14.7 备份策略

**数据库备份脚本** (`scripts/backup.sh`):

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/opt/backups/postgres"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
docker-compose -f /opt/nightdeal/docker-compose.prod.yml exec -T postgres \
  pg_dump -U nightdeal -d nightdeal \
  --format=custom \
  --compress=9 \
  > "$BACKUP_DIR/nightdeal_$TIMESTAMP.dump"

# 删除旧备份
find $BACKUP_DIR -name "*.dump" -mtime +$RETENTION_DAYS -delete

# 记录日志
echo "[$(date)] Backup completed: nightdeal_$TIMESTAMP.dump" >> /var/log/nightdeal-backup.log
```

**Cron任务**：

```bash
# 每天凌晨3点备份
0 3 * * * /opt/nightdeal/scripts/backup.sh

# 每周日凌晨4点清理日志
0 4 * * 0 find /var/log/nightdeal*.log.* -mtime +30 -delete
```

### 14.8 故障恢复

**数据库恢复**：

```bash
# 恢复数据库
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U nightdeal -d nightdeal \
  --clean \
  --if-exists \
  < /opt/backups/postgres/nightdeal_20240101_030000.dump
```

**服务重启**：

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启单个服务
docker-compose -f docker-compose.prod.yml restart app

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f --tail=100 app
```

**健康检查端点**：

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        redis: 'ok',
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      checks.services.database = 'error';
      checks.status = 'error';
    }

    try {
      await this.redis.ping();
    } catch (error) {
      checks.services.redis = 'error';
      checks.status = 'error';
    }

    return checks;
  }
}
```

---

## 15. Redis Adapter 配置（多实例扩展）

### 15.1 Redis IO Adapter 实现

```typescript
// src/redis/redis-io.adapter.ts
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

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      transports: ['websocket'], // 小程序仅支持 websocket
      cors: { origin: process.env.CORS_ORIGIN || '*' },
    });
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

### 15.2 安装依赖

```bash
npm install @socket.io/redis-adapter redis
```

> **注意**：推荐使用 `redis` v4+ 而非 `ioredis`，因为 Socket.IO 官方文档指出 `ioredis` 在某些场景下有订阅恢复问题。如需使用 `ioredis`，请参考 `@socket.io/redis-adapter` 文档中的 ioredis 示例。

---

## 16. API 详细规范

### 16.1 通用响应格式

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应**：

```json
{
  "code": 40001,
  "message": "参数错误",
  "error": {
    "field": "code",
    "message": "房间码不能为空"
  }
}
```

### 16.2 错误码定义

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| 0 | 200 | 成功 |
| 40001 | 400 | 参数错误 |
| 40002 | 400 | 房间码无效 |
| 40003 | 400 | 房间已满 |
| 40004 | 400 | 游戏已开始 |
| 40101 | 401 | 未登录 |
| 40102 | 401 | token过期 |
| 40103 | 401 | token无效 |
| 40301 | 403 | 无权限操作 |
| 40401 | 404 | 房间不存在 |
| 40402 | 404 | 用户不存在 |
| 40901 | 409 | 已在房间中 |
| 42901 | 429 | 请求过于频繁 |
| 50001 | 500 | 服务器内部错误 |
| 50002 | 500 | 微信接口错误 |
| 50003 | 500 | 数据库错误 |

### 16.3 REST API 详细规范

#### POST /api/auth/login

**描述**：微信登录，获取token

**请求**：

```json
{
  "code": "string"  // wx.login()返回的code
}
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx1234567890",
      "nickName": "",
      "avatarUrl": ""
    }
  }
}
```

**错误响应**：

```json
{
  "code": 50002,
  "message": "微信登录失败",
  "error": {
    "code": 40029,
    "message": "invalid code"
  }
}
```

**限流**：10次/分钟/IP

---

#### POST /api/auth/update-profile

**描述**：更新用户头像昵称

**请求头**：

```
Authorization: Bearer <token>
```

**请求**：

```json
{
  "nickName": "string",   // 可选，1-20字符
  "avatarUrl": "string"   // 可选，有效的URL
}
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "clx1234567890",
      "nickName": "玩家1",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }
}
```

**错误响应**：

```json
{
  "code": 40001,
  "message": "参数错误",
  "error": {
    "field": "nickName",
    "message": "昵称长度必须在1-20之间"
  }
}
```

---

#### POST /api/rooms

**描述**：创建房间

**请求头**：

```
Authorization: Bearer <token>
```

**请求**：

```json
{
  "roleConfig": {
    "merlin": true,
    "percival": true,
    "mordred": false,
    "morgana": true,
    "oberon": false,
    "assassin": true,
    "loyalServants": 1,
    "minions": 0
  },
  "maxPlayers": 10  // 可选，默认10，范围5-10
}
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "clx1234567890",
    "code": "ABC123",
    "status": "WAITING",
    "roleConfig": { ... },
    "maxPlayers": 10,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应**：

```json
{
  "code": 40001,
  "message": "参数错误",
  "error": {
    "field": "roleConfig",
    "message": "角色配置无效"
  }
}
```

---

#### GET /api/rooms/:code

**描述**：获取房间信息

**请求头**：

```
Authorization: Bearer <token>
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "clx1234567890",
    "code": "ABC123",
    "status": "WAITING",
    "roleConfig": { ... },
    "maxPlayers": 10,
    "host": {
      "id": "user123",
      "nickName": "房主",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "players": [
      {
        "id": "player123",
        "seatNo": 1,
        "user": {
          "id": "user123",
          "nickName": "房主",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "joinedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应**：

```json
{
  "code": 40401,
  "message": "房间不存在"
}
```

---

#### GET /api/health

**描述**：健康检查

**响应**：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

---

#### GET /api/rooms/:code/my-role

**描述**：获取自己在该房间中的角色（游戏开始后可用，用于断线重连恢复身份）

**请求头**：

```
Authorization: Bearer <token>
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "role": "梅林",
    "seatNo": 3
  }
}
```

**错误响应**：

```json
{
  "code": 40401,
  "message": "房间不存在"
}
```

```json
{
  "code": 40004,
  "message": "游戏尚未开始"
}
```

```json
{
  "code": 40301,
  "message": "你不在该房间中"
}
```

### 16.4 WebSocket 事件详细规范

#### room:join

**客户端发送**：

```json
{
  "roomCode": "ABC123"
}
```

**服务端响应（成功）**：

```json
{
  "room": {
    "id": "clx1234567890",
    "code": "ABC123",
    "status": "WAITING",
    "players": [ ... ]
  }
}
```

**服务端响应（错误）**：

```json
{
  "message": "房间不存在"
}
```

---

#### room:player-joined

**服务端广播**：

```json
{
  "player": {
    "id": "player123",
    "seatNo": 2,
    "user": {
      "id": "user456",
      "nickName": "新玩家",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  },
  "playerCount": 3
}
```

---

#### room:started

**服务端单播**：

```json
{
  "yourRole": "梅林"
}
```

---

#### room:error

**服务端发送**：

```json
{
  "message": "房间已满"
}
```
