# NightDeal 后端

阿瓦隆（Avalon）桌游辅助工具后端服务。基于 NestJS + PostgreSQL + Redis 构建。

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | 20 LTS |
| 框架 | NestJS | 10.x |
| 数据库 | PostgreSQL | 16 |
| ORM | Prisma | 6.x |
| 缓存 | Redis | 7 |
| 容器 | Docker + Docker Compose | - |

## 快速开始

### 前置条件

- **Node.js 20+**（推荐使用 nvm 管理版本）
- **Docker + Docker Compose**（用于运行 PostgreSQL 和 Redis）

### 1. 克隆项目

```bash
git clone https://github.com/kaiwenyao/nightdeal-backend.git
cd nightdeal-backend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动数据库服务

```bash
docker compose up -d
```

等待 PostgreSQL 和 Redis 健康检查通过：

```bash
docker compose ps
# 应看到两个服务都是 healthy 状态
```

### 4. 启动开发服务器

```bash
npm run start:dev
```

首次启动时会自动执行数据库迁移（创建表结构）。服务器启动后会显示：

```
NightDeal backend is running on: http://localhost:3000
```

### 5. 验证服务

```bash
curl http://localhost:3000/api/health
```

预期返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "services": {
      "database": "ok",
      "redis": "ok"
    }
  }
}
```

## 环境变量

项目使用 `.env` 文件管理环境变量。首次使用时请复制示例文件：

```bash
cp .env.example .env
```

### 变量说明

| 变量 | 说明 | 本地开发示例 | Docker 部署示例 |
|------|------|-------------|----------------|
| `PORT` | 服务端口 | `3000` | `3000` |
| `DATABASE_URL` | PostgreSQL 连接地址 | `postgresql://nightdeal:nightdeal@localhost:5432/nightdeal` | `postgresql://nightdeal:nightdeal@postgres:5432/nightdeal` |
| `REDIS_URL` | Redis 连接地址 | `redis://localhost:6379` | `redis://redis:6379` |
| `WX_APPID` | 微信小程序 AppID | `***REMOVED_APPID***` | 同左 |
| `WX_SECRET` | 微信小程序密钥 | `your_wx_secret_here` | 从密钥管理服务获取 |
| `JWT_SECRET` | JWT 签名密钥（至少 32 字符） | `your_jwt_secret_here_at_least_32_chars` | 从密钥管理服务获取 |

### 本地开发 vs 生产环境

**本地开发**：`.env` 中使用 `localhost` 作为数据库和 Redis 地址。

**Docker 部署**：使用 Docker 网络中的容器名（如 `postgres`、`redis`）作为地址。

## 数据库管理

### Prisma 迁移

项目使用 Prisma 进行数据库版本管理。迁移文件保存在 `prisma/migrations/` 目录下。

```bash
# 创建新迁移
npx prisma migrate dev --name <migration_name>

# 部署迁移到生产环境
npx prisma migrate deploy

# 查看数据库状态
npx prisma migrate status

# 重新生成 Prisma Client
npx prisma generate
```

### 自动迁移

生产环境部署时，应用启动会自动执行 `prisma migrate deploy`，确保数据库表结构与代码同步。

### 查看数据库

```bash
# 打开 Prisma Studio（Web 界面）
npx prisma studio
```

访问 http://localhost:5555 查看和编辑数据。

## 项目结构

```
nightdeal-backend/
├── docker-compose.yml          # PostgreSQL + Redis 服务
├── Dockerfile                  # 生产环境镜像
├── .env.example                # 环境变量示例
├── .env                        # 环境变量（gitignore）
├── package.json
├── tsconfig.json
├── nest-cli.json
├── prisma/
│   ├── schema.prisma           # 数据库 Schema
│   └── migrations/             # 数据库迁移文件
└── src/
    ├── main.ts                 # 应用入口
    ├── app.module.ts           # 根模块
    ├── config/
    │   └── config.module.ts    # 全局配置模块
    ├── prisma/
    │   ├── prisma.module.ts    # Prisma 全局模块
    │   └── prisma.service.ts   # 数据库服务
    ├── redis/
    │   ├── redis.module.ts     # Redis 全局模块
    │   └── redis.service.ts    # 缓存服务
    ├── health/
    │   ├── health.controller.ts # 健康检查接口
    │   └── health.module.ts
    ├── auth/
    │   ├── auth.module.ts      # 认证模块
    │   ├── auth.controller.ts  # 登录接口
    │   ├── auth.service.ts     # 认证服务
    │   ├── auth.guard.ts       # 鉴权守卫
    │   └── dto/                # 数据传输对象
    └── common/
        ├── filters/
        │   └── http-exception.filter.ts  # 全局异常过滤器
        └── interceptors/
            └── transform.interceptor.ts  # 响应格式化拦截器
```

## 可用脚本

```bash
# 开发模式（热重载）
npm run start:dev

# 构建生产版本
npm run build

# 运行生产版本
npm start

# Prisma 相关
npm run prisma:migrate    # 创建迁移
npm run prisma:deploy     # 部署迁移
npm run prisma:generate   # 生成 Client
```

## API 接口

### 健康检查

```
GET /api/health
```

### 认证

```
POST /api/auth/login
Body: { "code": "wx_login_code" }
Response: { "token": "jwt_token", "user": { "id": "...", "nickName": "", "avatarUrl": "" } }

POST /api/auth/update-profile
Header: Authorization: Bearer <token>
Body: { "nickName": "玩家1", "avatarUrl": "https://..." }
```

## 常见问题

### 端口被占用

如果 5432 或 6379 端口被占用，可以修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - '5433:5432'  # 改为 5433
```

同时更新 `.env` 中的连接地址。

### 数据库连接失败

确保 Docker 容器已启动且健康检查通过：

```bash
docker compose ps
docker compose logs postgres
```

### Prisma Client 未生成

```bash
npx prisma generate
```

### 重置数据库

```bash
# 删除所有数据并重新迁移
npx prisma migrate reset
```

## 开发文档

详细的开发计划和架构设计请参考 [DEVELOPMENT.md](./DEVELOPMENT.md)。
