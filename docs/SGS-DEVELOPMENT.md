# SGS Development Guide

本文档描述当前 SGS 游戏模式在后端中的实现状态、数据结构和接口约定。

## 1. 当前范围

SGS 是通过通用房间模型支持的第二种游戏类型。当前实现包含：

- `GameType.SGS`
- SGS 房间创建和设置更新
- SGS 角色配置校验
- SGS 角色随机分配
- REST 和 WebSocket 开局流程
- 游戏结束后回到等待状态

当前没有单独的 SGS restart 接口或 `room:restart` WebSocket 事件。再次开局需要先调用结束接口，让房间回到 `WAITING`。

## 2. 数据模型

### 2.1 GameType

Prisma enum：

```prisma
enum GameType {
  AVALON
  SGS
}
```

### 2.2 Room

SGS 使用现有 `Room` 表：

| 字段 | SGS 相关说明 |
| --- | --- |
| `gameType` | SGS 房间写入 `SGS` |
| `roleConfig` | SGS 角色配置 JSON |
| `maxPlayers` | SGS 允许 2 到 8 |
| `status` | `WAITING`、`PLAYING`、`FINISHED` |

创建房间时如果未传 `maxPlayers`，SGS 默认使用 2 人。

### 2.3 RoomPlayer

SGS 开局后会把每个玩家的角色写入 `RoomPlayer.role`。房间公开状态广播不会包含其他玩家角色；每个玩家通过个人事件收到自己的角色。

### 2.4 GameRecord

开局时创建 `GameRecord`，其中 `roles` 保存角色分配快照。结束游戏时，未结束的记录写入 `endedAt`。

## 3. 角色类型

当前 SGS 角色：

| 角色 | 说明 |
| --- | --- |
| `MONARCH` | 主公 |
| `MINISTER` | 忠臣 |
| `REBEL` | 反贼 |
| `TRAITOR` | 内奸 |

角色分配使用 `crypto.randomInt` 洗牌，不使用 `Math.random`。

## 4. 人数规则

| 游戏 | 默认人数 | 最小人数 | 最大人数 |
| --- | --- | --- | --- |
| SGS | 2 | 2 | 8 |

通用 DTO 的 `maxPlayers` 上限是 10，但 `RoomService` 会继续执行游戏类型级别校验，SGS 超过 8 会被拒绝。

## 5. 角色配置

SGS 配置通过 `sgsRoleConfigSchema` 校验。服务端会在创建房间、更新设置和开局时使用当前配置计算角色分配。

开发约定：

- 不要绕过 schema 直接信任客户端传入的 JSON
- 修改 SGS 配置字段时，需要同步更新 DTO、schema、角色分配器和测试
- 如果新增角色，需要检查所有人数下的角色数量总和

## 6. REST API

SGS 复用通用房间接口。

### 6.1 创建 SGS 房间

```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "maxPlayers": 4,
  "roleConfig": {}
}
```

如果不传 `gameType`，默认创建 Avalon 房间。

### 6.2 更新 SGS 设置

```http
PATCH /api/rooms/:code/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "gameType": "SGS",
  "maxPlayers": 4,
  "roleConfig": {}
}
```

兼容入口：

```http
PUT /api/rooms/:code/settings
```

限制：

- 只有房主可以更新设置
- 房间必须处于 `WAITING`
- 设置必须满足 SGS 的人数和角色配置规则

### 6.3 SGS 开局

```http
POST /api/rooms/:code/start
Authorization: Bearer <token>
```

限制：

- 只有房主可以开局
- 房间必须处于 `WAITING`
- 当前人数必须至少为 2
- 当前房间 `gameType` 为 `SGS` 时使用 SGS 角色分配

### 6.4 结束 SGS 游戏

```http
POST /api/rooms/:code/end
Authorization: Bearer <token>
```

效果：

- 清空玩家角色
- 房间回到 `WAITING`
- 当前 `GameRecord` 写入 `endedAt`
- Redis 房间状态更新为 `WAITING`

## 7. WebSocket API

SGS 复用 `/room` namespace。

### 7.1 更新设置

```json
{
  "roomCode": "ABCDEF",
  "maxPlayers": 4,
  "roleConfig": {}
}
```

事件：

```text
room:settings-update
```

成功后服务端广播：

```text
room:settings-updated
room:state
```

### 7.2 开局

客户端发送：

```text
room:start
```

Payload：

```json
{
  "roomCode": "ABCDEF"
}
```

服务端会：

1. 调用 `RoomService.startGame`
2. 将公开房间状态广播给房间
3. 逐个向 `user:{userId}` 发送 `room:started`

`room:started` 中只包含当前用户自己的角色。

### 7.3 结束

客户端发送：

```text
room:end
```

Payload：

```json
{
  "roomCode": "ABCDEF"
}
```

成功后服务端广播：

```text
room:ended
room:state
```

## 8. 前端对接

当前小程序端相关页面：

| 页面 | 说明 |
| --- | --- |
| `pages/game-select` | 选择 Avalon 或 SGS |
| `pages/room-settings` | 配置房间游戏类型、人数和角色配置 |
| `pages/room` | 房间等待和开局入口 |
| `pages/game` | 展示当前玩家角色 |

当前小程序端通过 `utils/socket.ts` 自定义封装 `wx.connectSocket`，不是 `weapp.socket.io`。

## 9. 测试重点

修改 SGS 相关逻辑时应覆盖：

- 创建 SGS 房间默认人数为 2
- SGS 人数边界 2 到 8
- SGS 角色配置 schema 校验
- SGS 角色分配数量和唯一性
- REST 开局和结束状态变化
- WebSocket `room:start` 只向用户发送自己的角色
- 更新设置只能在 `WAITING` 状态由房主执行

## 10. 开发注意事项

- SGS 与 Avalon 共用 `RoomService`，修改通用房间状态机时必须同时检查两个游戏类型
- 角色分配器应保持纯函数风格，避免依赖数据库或 Redis
- 不要在公开 `room:state` 中包含玩家角色
- 新增 SGS 角色时，需要同步前端角色展示文案和测试数据
