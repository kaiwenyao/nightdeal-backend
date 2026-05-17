# NightDeal Backend

NightDeal 后端是微信小程序游戏房间服务，当前支持 Avalon 和 SGS 两种游戏类型的通用房间、角色配置和角色分配。服务基于 NestJS、PostgreSQL、Redis 和 Socket.IO 构建。

> 当前 Avalon 只实现房间生命周期和身份分配，尚未实现组队、公投、任务、刺杀等完整阿瓦隆对局状态机。

## 技术栈

| 组件 | 技术 | 当前版本 |
| --- | --- | --- |
| Runtime | Node.js | 20+ |
| Framework | NestJS | 11.x |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 7.x |
| Cache | Redis | 7 |
| Realtime | Socket.IO | 4.x |
| Storage | Aliyun OSS + sharp | - |
| Test | Jest | 30.x |

## 快速开始

### 前置条件

- Node.js 20+
- Docker + Docker Compose

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 PostgreSQL 和 Redis

```bash
docker compose up -d
docker compose ps
```

`postgres` 和 `redis` 都应处于 healthy 状态。

### 3. 配置环境变量

```bash
cp .env.example .env
```

按本地环境修改 `.env`。最少需要配置数据库、Redis、微信、JWT、session 加密和 OSS 相关变量。

### 4. 启动开发服务

```bash
npm run start:dev
```

`start:dev` 会先执行：

```bash
prisma migrate deploy && prisma generate
```

服务默认监听：

```text
http://localhost:3000
```

非生产环境 Swagger 地址：

```text
http://localhost:3000/api/docs
```

### 5. 验证服务

```bash
curl http://localhost:3000/api/health
```

成功响应会经过统一包装：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "ok",
    "timestamp": "2026-05-10T00:00:00.000Z",
    "services": {
      "database": "ok",
      "redis": "ok"
    }
  }
}
```

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `PORT` | 服务端口 |
| `DATABASE_URL` | PostgreSQL 连接地址 |
| `REDIS_URL` | Redis 连接地址 |
| `WX_APPID` | 微信小程序 AppID |
| `WX_SECRET` | 微信小程序密钥 |
| `WX_LOGIN_TIMEOUT_MS` | 微信登录请求超时时间 |
| `JWT_SECRET` | JWT 签名密钥 |
| `SESSION_ENCRYPTION_KEY` | 32 字节 AES-256-GCM session 加密密钥 |
| `OSS_ACCESS_KEY_ID` | 阿里云 OSS AccessKey ID |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS AccessKey Secret |
| `OSS_ENDPOINT` | OSS endpoint |
| `OSS_BUCKET` | OSS bucket |
| `OSS_REGION` | OSS region |
| `OSS_AVATAR_KEY_PREFIX` | 头像对象 key 前缀 |
| `AVATAR_URL_PREFIX` | 头像公开 URL 前缀和用户头像 URL 白名单前缀 |
| `CORS_ORIGIN` | 可选，允许的 HTTP / WebSocket 来源 |
| `CORS_CREDENTIALS` | 可选，设置为 `false` 时关闭 HTTP credentials |

生产环境不要使用示例密钥。`JWT_SECRET` 和 `SESSION_ENCRYPTION_KEY` 在启动时都由 Joi 校验为至少 32 个字符（见 `src/config/config.module.ts`），校验不通过会直接终止启动。`AuthService` 取 `SESSION_ENCRYPTION_KEY` 的 UTF-8 编码前 32 字节作为 AES-256-GCM 密钥；若编码不足 32 字节会立即抛错（在 Joi 校验通过的前提下不会发生）。

## 项目结构

```text
nightdeal-backend/
├── src/
│   ├── auth/                  # 微信登录、JWT、用户资料
│   ├── common/                # 全局过滤器、拦截器、WebSocket guard
│   ├── config/                # 环境变量校验
│   ├── health/                # 健康检查
│   ├── prisma/                # Prisma service
│   ├── redis/                 # Redis service 和 Socket.IO adapter
│   ├── room/                  # 房间、角色分配、REST 和 WebSocket
│   ├── storage/               # 头像压缩和 OSS 上传
│   └── main.ts                # 应用入口
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── generated/prisma/      # Prisma Client 输出目录
├── docs/
│   ├── AVALON-DEVELOPMENT.md
│   ├── SGS-DEVELOPMENT.md
│   └── wechat-auth.md
├── DEVELOPMENT.md
├── docker-compose.yml
├── Dockerfile
├── Jenkinsfile
└── package.json
```

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run start:dev` | 开发模式启动 |
| `npm start` | 运行构建后的生产入口 |
| `npm run build` | 构建项目 |
| `npm test` | 运行 Jest 测试 |
| `npm test -- --runInBand` | 单进程运行测试，CI/排查推荐 |
| `npm run test:cov` | 测试覆盖率 |
| `npm run prisma:migrate` | 创建开发迁移 |
| `npm run prisma:deploy` | 部署迁移 |
| `npm run prisma:generate` | 生成 Prisma Client |

## 数据库管理

```bash
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:generate
```

查看数据库：

```bash
npx prisma studio
```

重置本地数据库：

```bash
npx prisma migrate reset
```

## REST API 摘要

所有业务响应默认经过统一包装：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### Health

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/health` | 否 | 健康检查 |

### Auth

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | 否 | 微信 code 登录 |
| `POST` | `/api/auth/update-profile` | 是 | 更新昵称和头像 |
| `POST` | `/api/auth/avatar/credential` | 是 | 已废弃，返回 410 |
| `POST` | `/api/auth/avatar/upload` | 是 | 上传头像到 OSS |

### Rooms

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/rooms` | 是 | 创建房间 |
| `GET` | `/api/rooms/:code` | 是 | 获取房间详情 |
| `POST` | `/api/rooms/:code/join` | 是 | 加入房间 |
| `POST` | `/api/rooms/:code/leave` | 是 | 离开房间 |
| `POST` | `/api/rooms/:code/start` | 是 | 开始游戏 |
| `POST` | `/api/rooms/:code/end` | 是 | 结束游戏 |
| `POST` | `/api/rooms/:code/kick` | 是 | 房主踢人 |
| `PATCH` | `/api/rooms/:code/settings` | 是 | 更新房间设置 |
| `PUT` | `/api/rooms/:code/settings` | 是 | 更新房间设置兼容入口 |
| `GET` | `/api/rooms/:code/my-role` | 是 | 获取自己的角色 |

## WebSocket 摘要

命名空间：

```text
/room
```

认证：

```ts
io('/room', {
  auth: { token },
  transports: ['websocket'],
});
```

客户端事件：

| 事件 | 说明 |
| --- | --- |
| `room:join` | 加入或重连房间 |
| `room:leave` | 离开房间 |
| `room:kick` | 房主踢人 |
| `room:start` | 开始游戏 |
| `room:end` | 结束游戏 |
| `room:settings-update` | 更新房间设置 |
| `player:update` | 更新当前用户昵称/头像并向所在房间广播 `player:updated` |

服务端会通过 `room:state` 广播公开房间状态，并通过 `user:{userId}` 单独发送玩家自己的角色。

## 开发文档

| 文档 | 内容 |
| --- | --- |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 当前后端实现、接口、数据模型、Redis、测试重点 |
| [docs/wechat-auth.md](./docs/wechat-auth.md) | 微信登录、JWT、session 和头像上传 |
| [docs/AVALON-DEVELOPMENT.md](./docs/AVALON-DEVELOPMENT.md) | 当前 Avalon 通用房间和身份分配实现，以及完整状态机未实现边界 |
| [docs/SGS-DEVELOPMENT.md](./docs/SGS-DEVELOPMENT.md) | SGS 游戏模式实现 |

## 提交前检查

```bash
npm test -- --runInBand
npm run build
```

如果修改了 Prisma schema：

```bash
npm run prisma:generate
```
