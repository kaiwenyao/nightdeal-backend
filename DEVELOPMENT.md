# NightDeal Backend Development Guide

本文档描述当前代码已经实现的后端能力、接口契约和本地开发流程。它不是路线图；如果代码行为和旧文档冲突，以当前实现为准。

## 1. 项目概览

NightDeal 后端是一个基于 NestJS 的微信小程序游戏房间服务，当前支持：

- 微信 `code2Session` 登录、JWT 认证和服务端 session 校验
- 用户资料更新和头像上传到阿里云 OSS
- Avalon 和 SGS 两种游戏类型的房间创建、加入、离开、踢人、设置、开局、结束
- 当前 Avalon 仅覆盖通用房间生命周期和身份分配；组队、公投、任务、刺杀等完整状态机尚未实现
- REST API 与 `/room` Socket.IO 命名空间协同：多数房间写操作在 REST 成功后会广播 WS 事件；**`POST /api/rooms/:code/join` 成功后会广播 `room:player-joined` 与 `room:state`**（加入方 WebSocket 仍需 `room:join` 进入 Socket.IO 房间）
- PostgreSQL 持久化、Redis 缓存/会话/限流/离线状态
- Swagger、结构化日志、全局响应包装和异常过滤

## 2. 技术栈

| 层 | 技术 |
| --- | --- |
| Runtime | Node.js 20+（Docker 镜像为 `node:22-alpine`） |
| Framework | NestJS 11 |
| Database | PostgreSQL + Prisma 7 |
| Cache / Session | Redis |
| Realtime | Socket.IO + `@socket.io/redis-adapter` |
| Auth | WeChat `jscode2session` + JWT |
| Validation | `class-validator`、`class-transformer`、Zod |
| Logging | `nestjs-pino` |
| Storage | Aliyun OSS + `sharp` |
| Test | Jest |

## 3. 本地开发

### 3.1 安装依赖

```bash
npm install
```

### 3.2 环境变量

`.env` 需要包含以下变量：

| 变量 | 用途 |
| --- | --- |
| `PORT` | HTTP 服务端口 |
| `DATABASE_URL` | PostgreSQL 连接字符串，供 Prisma adapter 使用 |
| `REDIS_URL` | Redis 连接字符串 |
| `WX_APPID` | 微信小程序 AppID |
| `WX_SECRET` | 微信小程序 AppSecret |
| `WX_LOGIN_TIMEOUT_MS` | 微信登录请求超时时间，默认行为按代码配置处理 |
| `JWT_SECRET` | JWT 签名密钥 |
| `SESSION_ENCRYPTION_KEY` | 32 字节 session_key 加密密钥 |
| `OSS_ACCESS_KEY_ID` | 阿里云 OSS AccessKey ID |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS AccessKey Secret |
| `OSS_ENDPOINT` | OSS endpoint |
| `OSS_BUCKET` | OSS bucket |
| `OSS_REGION` | OSS region |
| `OSS_AVATAR_KEY_PREFIX` | 头像对象 key 前缀 |
| `AVATAR_URL_PREFIX` | 允许写入用户资料的头像 URL 前缀 |
| `CORS_ORIGIN` | 可选，HTTP 和 Socket.IO 允许的来源 |
| `CORS_CREDENTIALS` | 可选，`false` 时关闭 HTTP credentials |

`JWT_SECRET` 和 `SESSION_ENCRYPTION_KEY` 在启动时都由 Joi 校验为至少 32 个字符（见 `src/config/config.module.ts`），校验不通过会直接终止启动。`AuthService` 取 `SESSION_ENCRYPTION_KEY` 的 UTF-8 编码前 32 字节作为 AES-256-GCM 密钥；若编码不足 32 字节会立即抛错。该错误分支在 Joi 校验通过的前提下不可达，仅用于直接实例化等绕过校验的场景；生产环境应使用完整长度的随机密钥。

### 3.3 常用命令

```bash
npm run start:dev
npm run build
npm test
npm test -- --runInBand
npm run test:cov
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
```

`start` 和 `start:dev` 会通过 `prestart` / `prestart:dev` 先执行 `prisma migrate deploy && prisma generate`。

## 4. 应用启动行为

`src/main.ts` 当前启动流程：

1. 启用 `helmet`
2. 连接 Redis 并注册 Socket.IO Redis adapter
3. 设置全局路由前缀 `/api`
4. 根据 `CORS_ORIGIN` 和 `CORS_CREDENTIALS` 配置 HTTP CORS
5. 注册全局 `ValidationPipe`
   - `whitelist: true`
   - `forbidNonWhitelisted: true`
   - `transform: true`
6. 注册 `TransformInterceptor` 和 `HttpExceptionFilter`
7. 非生产环境启用 Swagger，地址为 `/api/docs`

Socket.IO 网关位于 `/room` namespace，允许 Engine.IO 3 客户端连接，并使用 Redis adapter 做跨实例广播。

## 5. 数据模型

### 5.1 User

| 字段 | 说明 |
| --- | --- |
| `id` | CUID 主键 |
| `openId` | 微信 openid，唯一 |
| `nickName` | 昵称，默认空字符串 |
| `avatarUrl` | 头像 URL，默认空字符串 |
| `createdAt` / `updatedAt` | 创建和更新时间 |

### 5.2 Room

| 字段 | 说明 |
| --- | --- |
| `code` | 6 位大写字母房间码，唯一 |
| `hostId` | 房主用户 ID |
| `status` | `WAITING`、`PLAYING`（结束本局后回到 `WAITING`） |
| `gameType` | `AVALON` 或 `SGS` |
| `roleConfig` | JSON 角色配置 |
| `maxPlayers` | 最大玩家数 |
| `createdAt` / `updatedAt` | 创建和更新时间 |

索引：`code`、`status`、`updatedAt`。

### 5.3 RoomPlayer

| 字段 | 说明 |
| --- | --- |
| `roomId` | 房间 ID |
| `userId` | 用户 ID |
| `seatNo` | 座位号 |
| `role` | 开局后写入的角色 |
| `joinedAt` | 加入时间 |

约束：

- 同一用户不能重复加入同一房间：`roomId + userId`
- 同一房间座位号唯一：`roomId + seatNo`
- `userId` 有索引，便于查询用户所在房间

### 5.4 GameRecord

| 字段 | 说明 |
| --- | --- |
| `roomId` | 房间 ID |
| `roles` | 开局时的角色分配快照 |
| `startedAt` | 开局时间 |
| `endedAt` | 结束时间，可为空 |

`roomId` 有索引。

## 6. Redis 使用

| Key | 类型 | TTL | 用途 |
| --- | --- | --- | --- |
| `session:{userId}` | String | 7200 秒 | JSON：`{ userId, sessionKey }`，`sessionKey` 为加密后的微信 `session_key` |
| `room:{code}` | Hash | 86400 秒 | 房间状态、房主、人数、人数上限、最后活跃时间 |
| `room:{code}:offline:{userId}` | String | 3600 秒 | 玩家离线时间戳 |
| `ws-rate:user:{userId}` | String counter | 1 秒 | WebSocket 用户限流 |
| `ws-rate:socket:{socketId}` | String counter | 1 秒 | 未认证 socket 限流兜底 |

`room:{code}` 当前字段包括：

- `status`
- `hostId`
- `playerCount`
- `maxPlayers`
- `lastActiveAt`，在玩家离线/重连时更新

## 7. 认证与用户

### 7.1 登录流程

1. 客户端提交微信 `code`
2. 后端调用微信 `jscode2session`
3. 根据 `openid` 创建或更新用户
4. 使用 `JwtService` 签发 2 小时 JWT
5. 使用 AES-256-GCM 加密 `session_key`
6. 将加密后的 session 写入 Redis：`session:{userId}`

微信接口超时会返回网关超时类错误；网络失败会返回服务不可用类错误；微信返回业务错误时，服务端只记录必要日志，并向客户端返回泛化错误。

### 7.2 JWT 校验

HTTP 接口使用 `AuthGuard`。WebSocket 使用 `WsJwtGuard`，从以下位置读取 token：

- `handshake.auth.token`
- `Authorization: Bearer <token>`

`AuthService.verifyToken` 会同时校验 JWT 和 Redis session，Redis session 不存在时认证失败。

### 7.3 用户资料

昵称规则：

- 长度 1 到 20
- 允许中文、英文、数字、下划线、空格、`·`、`.`、`-`

头像规则：

- 允许空字符串
- 必须是 HTTPS URL
- 必须以 `AVATAR_URL_PREFIX` 开头

## 8. 头像上传

当前不再使用前端直传凭证接口。

| 接口 | 状态 |
| --- | --- |
| `POST /api/auth/avatar/credential` | 仍保留兼容入口，但固定返回 `410 Gone` |
| `POST /api/auth/avatar/upload` | 当前实际上传入口 |

上传接口要求：

- JWT 认证
- `multipart/form-data`
- 文件字段名：`avatar`
- 最大 5MB
- MIME 类型：JPEG、PNG、WebP、GIF
- 每用户限流：10 次/分钟

处理流程：

1. 使用 `sharp` 读取图片
2. 限制最长边 256px，不放大小图
3. 转成 progressive JPEG
4. 从质量 80 开始压缩，最低到 30，目标不超过 100KB
5. 上传到 OSS：`{OSS_AVATAR_KEY_PREFIX}{userId}/{timestamp}.jpg`
6. 返回 URL：`{AVATAR_URL_PREFIX}{userId}/{timestamp}.jpg`

## 9. 房间规则

### 9.1 游戏人数

| 游戏 | 默认人数 | 最小人数 | 最大人数 |
| --- | --- | --- | --- |
| Avalon | 5 | 5 | 10 |
| SGS | 2 | 2 | 8 |

`CreateRoomDto` 和 `UpdateRoomSettingsDto` 的通用 DTO 范围是 2 到 10，具体游戏边界由 `RoomService` 继续校验。

### 9.2 房间码

房间码为 6 位大写字母。REST path 参数会转换为大写后校验。

### 9.3 加入房间

加入条件：

- 房间存在
- 房间状态为 `WAITING`
- 用户未在该房间内
- 当前人数小于 `maxPlayers`

座位号按当前可用座位分配，并受数据库唯一约束保护。

### 9.4 离开房间

`WAITING` 状态：

- 房主离开时，如果还有其他玩家，房主转移给最小座位号玩家
- 最后一名玩家离开时删除房间
- 普通玩家离开时删除自己的 `RoomPlayer`

`PLAYING` 状态：

- 离开不会立即删除玩家
- 服务会写入离线标记，由 WebSocket 重连逻辑处理

### 9.5 开局和结束

开局要求：

- 只有房主可以开局
- 房间必须是 `WAITING`
- 人数必须满足当前游戏最小人数
- 角色配置必须通过对应游戏的 Zod schema

开局效果：

- 分配角色并写入 `RoomPlayer.role`
- 房间状态改为 `PLAYING`
- 创建 `GameRecord`
- Redis 房间状态改为 `PLAYING`

结束游戏要求：

- 只有房主可以结束
- 房间必须是 `PLAYING`

结束效果：

- 清空玩家角色
- 房间状态改为 `WAITING`
- 当前未结束的 `GameRecord` 写入 `endedAt`
- Redis 房间状态改为 `WAITING`

## 10. 游戏配置

### 10.1 Avalon

当前实现说明见 [`docs/AVALON-DEVELOPMENT.md`](./docs/AVALON-DEVELOPMENT.md)。该文档同时标明完整阿瓦隆状态机尚未实现的边界。

Avalon 支持的角色配置字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `merlin` | Boolean | 是否启用梅林 |
| `percival` | Boolean | 派西维尔 |
| `morgana` | Boolean | 莫甘娜 |
| `mordred` | Boolean | 莫德雷德 |
| `oberon` | Boolean | 奥伯伦 |
| `assassin` | Boolean | 刺客 |
| `loyalServants` | Integer | 忠臣数量，0 到 10 |
| `minions` | Integer | 爪牙数量，0 到 10 |

Zod schema 中上述布尔字段默认均为 `false`；创建房间未传 `roleConfig` 时，服务端会使用 `getDefaultConfig(maxPlayers)` 的标准预设（通常包含梅林、派西维尔、莫甘娜、刺客等）。角色分配使用 `crypto.randomInt` 洗牌。

### 10.2 SGS

SGS 支持 2 到 8 人。`roleConfig` 中各字段为**数量**（整数），开局后写入 `RoomPlayer.role` 的中文名如下：

| 配置字段 | 含义 | 分配角色名 | 阵营 |
| --- | --- | --- | --- |
| `monarch` | 主公数量（0 或 1） | 主公 | `monarch` |
| `loyalist` | 忠臣数量 | 忠臣 | `monarch` |
| `rebel` | 反贼数量 | 反贼 | `rebel` |
| `traitor` | 内奸数量 | 内奸 | `traitor` |

SGS 配置通过 `SgsRoleConfigSchema` 校验，角色分配同样使用 `crypto.randomInt`。

当前没有 REST 或 WebSocket 的 restart 接口；再次开局应先结束当前游戏，使房间回到 `WAITING`。

## 11. REST API

所有业务接口默认返回统一响应包装：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

错误由全局异常过滤器包装，具体 HTTP status 仍由异常类型决定。

错误响应形如：

```json
{
  "code": 40001,
  "message": "参数错误"
}
```

当前业务错误码映射：

| HTTP 场景 | `code` | 默认消息 |
| --- | --- | --- |
| `BadRequestException` | `40001` | 参数错误 |
| `UnauthorizedException` | `40101` | 未登录 |
| `ForbiddenException` | `40301` | 无权限操作 |
| `NotFoundException` | `40401` | 房间不存在 |
| `GoneException` | `41001` | 接口已废弃 |
| `429` | `42901` | 请求过于频繁 |
| `WeChatApiException` | `50002` | 微信服务暂时不可用，请稍后重试 |
| 其他服务端错误 | `50001` | 服务器内部错误 |

补充说明：

- **已在房间中**：`ConflictException`，业务码 `40901`、消息「你已在房间中」。
- **微信登录超时 / 网络失败**：开发环境分别为 HTTP 504 / 503，业务码均为 `50001`；生产环境 message 统一为「服务器内部错误」。
- **生产环境**：所有 4xx/5xx 的 `message` 使用上表默认文案，不返回具体业务描述。

非生产环境响应会额外包含清理后的 `error` 字段；生产环境只返回泛化消息，避免泄露内部细节。

### 11.1 Health

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/health` | 否 | 健康检查 |

### 11.2 Auth

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | 否 | 微信 code 登录，5 次/分钟限流 |
| `POST` | `/api/auth/update-profile` | 是 | 更新昵称和头像 |
| `POST` | `/api/auth/avatar/credential` | 是 | 已废弃，固定返回 410 |
| `POST` | `/api/auth/avatar/upload` | 是 | 服务端接收并上传头像，10 次/分钟限流 |

### 11.3 Rooms

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/rooms` | 是 | 创建房间 |
| `GET` | `/api/rooms/:code` | 是 | 获取房间详情；须为房间成员或房主，否则 `40301` |
| `POST` | `/api/rooms/:code/join` | 是 | 加入房间（广播 `room:player-joined` 与 `room:state`，见 §1） |
| `POST` | `/api/rooms/:code/leave` | 是 | 离开房间 |
| `POST` | `/api/rooms/:code/start` | 是 | 开始游戏 |
| `POST` | `/api/rooms/:code/end` | 是 | 结束游戏 |
| `POST` | `/api/rooms/:code/kick` | 是 | 房主踢人；body：`{ "userId": "..." }`（WS `room:kick` 使用 `targetUserId`） |
| `PATCH` | `/api/rooms/:code/settings` | 是 | 更新房间设置；成功后广播 `room:settings-updated` 与 `room:state` |
| `PUT` | `/api/rooms/:code/settings` | 是 | 更新房间设置，兼容入口；行为同 `PATCH` |
| `GET` | `/api/rooms/:code/my-role` | 是 | 获取自己的角色 |

## 12. WebSocket API

连接地址：

```text
/room
```

认证方式：

```ts
io('/room', {
  auth: { token },
  transports: ['websocket'],
});
```

服务端会把每个连接加入 `user:{userId}` room，并维护用户到 socket id 的映射。一个用户可以有多个连接；只有该用户最后一个连接断开时，才进入离线处理。

### 12.1 客户端事件

| 事件 | Payload | 说明 |
| --- | --- | --- |
| `room:join` | `{ roomCode }` | 加入或重连房间 |
| `room:leave` | `{ roomCode }` | 离开房间 |
| `room:kick` | `{ roomCode, targetUserId }` | 房主踢人 |
| `room:start` | `{ roomCode }` | 房主开始游戏 |
| `room:end` | `{ roomCode }` | 房主结束游戏 |
| `room:settings-update` | `{ roomCode, roleConfig?, maxPlayers? }` | 房主更新设置 |
| `player:update` | `{ nickName?, avatarUrl? }` | 更新当前用户资料并广播到其所在房间 |

### 12.2 服务端事件

| 事件 | 说明 |
| --- | --- |
| `room:state` | 房间公开状态，玩家列表不包含角色 |
| `room:started` | 游戏开始或重连到游戏中房间；每个用户只收到 `{ yourRole }` |
| `room:ended` | 游戏已结束并回到等待状态 |
| `room:player-joined` | 有玩家加入 |
| `room:player-left` | 有玩家离开或被踢 |
| `room:offline` | 有玩家离线 |
| `room:reconnected` | 有玩家重连 |
| `room:settings-updated` | 设置已更新 |
| `player:updated` | 有玩家资料更新 |
| `room:error` | WebSocket 错误；`code` 见下表 |

`room:error` 的 `code` 常量（`src/common/constants/ws-error-codes.ts`）：

| `code` | 典型场景 |
| --- | --- |
| `UNAUTHORIZED` | 消息处理时 token 无效（`WsJwtGuard`） |
| `TOKEN_EXPIRED` | 连接握手时 token 无效或过期 |
| `ROOM_NOT_FOUND` | 房间不存在 |
| `GAME_ALREADY_STARTED` | 等待中房间已满或状态不允许加入 |
| `ROOM_FULL` | 房间人数已满 |
| `KICKED` | 被房主踢出 |
| `ROOM_ERROR` | 其它房间业务错误 |
| `INTERNAL_ERROR` | 服务端内部错误 |

### 12.3 限流和离线

WebSocket 业务事件按用户限流：

- 10 次/秒
- Redis 失败时拒绝请求
- 未识别用户时以 socket id 作为兜底 key

断线处理：

1. 用户最后一个 socket 断开时，查询其所在房间
2. 写入离线 Redis key，并广播 `room:offline`
3. 设置 5 分钟内存定时器
4. 定时器触发时，如果玩家仍离线且房间不是 `PLAYING`，执行离开房间并广播状态

等待中房间还有定时清理：

- 每 5 分钟清理等待房间里的离线玩家
- 每 10 分钟清理超过 30 分钟无活跃更新的等待房间

## 13. 安全要点

当前实现包含以下防护：

- HTTP 全局 `helmet`
- DTO 白名单、禁止未知字段、自动类型转换
- HTTP JWT guard 和 WebSocket JWT guard
- JWT 校验后继续检查 Redis session
- 微信 `session_key` 使用 AES-256-GCM 加密后再写入 Redis
- 登录、头像上传和 WebSocket 业务事件限流
- 头像上传限制文件大小、MIME 类型、输出尺寸和输出体积
- 头像 URL 更新限制为 HTTPS 且必须匹配 `AVATAR_URL_PREFIX`
- WebSocket 房间状态广播不会泄露其他玩家角色
- Prisma 数据库唯一约束保护重复加入和座位冲突

开发时需要注意：

- 不要把 `WX_SECRET`、`JWT_SECRET`、`SESSION_ENCRYPTION_KEY`、OSS 密钥提交到仓库
- 生产环境必须设置明确的 `CORS_ORIGIN`
- `JWT_SECRET` 和 `SESSION_ENCRYPTION_KEY` 不应使用示例值或弱口令
- 阿里云 OSS bucket 权限应只开放必要读取能力，写入通过后端完成

## 14. 前端对接约定

当前小程序端使用自定义 `wx.connectSocket` Socket.IO 协议封装，不依赖 `weapp.socket.io`。

主要前端模块：

| 文件 | 说明 |
| --- | --- |
| `nightdeal-minip/miniprogram/utils/request.ts` | HTTP 请求封装 |
| `nightdeal-minip/miniprogram/utils/auth.ts` | 登录和 token 管理 |
| `nightdeal-minip/miniprogram/utils/socket.ts` | Socket.IO over WeChat socket 封装 |
| `nightdeal-minip/miniprogram/pages/index` | 首页、登录、创建/加入入口 |
| `nightdeal-minip/miniprogram/pages/room` | 房间等待页 |
| `nightdeal-minip/miniprogram/pages/room-settings` | 房间设置页 |
| `nightdeal-minip/miniprogram/pages/game-select` | 游戏选择页 |
| `nightdeal-minip/miniprogram/pages/game` | 游戏角色页 |

接口数据结构变更时，需要同时检查后端 DTO、前端 request 封装、页面状态更新和 WebSocket 事件处理。

## 15. 测试重点

已有测试主要覆盖：

- AuthService 登录、token、session 和微信接口错误处理
- 头像上传、压缩、URL 校验和鉴权
- RoomService 创建、加入、离开、踢人、开局、结束、设置、清理逻辑
- RoomGateway 连接、认证、事件、限流、离线和重连
- Avalon / SGS 角色校验和分配
- 全局异常过滤、响应转换、配置校验

修改以下区域时建议优先补测试：

- 房间状态机
- 角色分配规则
- WebSocket 事件和断线重连
- Redis key/TTL 行为
- 认证、头像上传和用户输入校验

## 16. 提交前检查

推荐在提交前执行：

```bash
npm test -- --runInBand
npm run build
```

如果改动涉及 Prisma schema，还需要执行：

```bash
npm run prisma:generate
```

如果改动涉及数据库迁移，还需要生成并检查 migration，再在部署环境执行：

```bash
npm run prisma:deploy
```
