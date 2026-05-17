# Avalon Backend Guide

本文档描述当前后端已经实现的 Avalon 能力。当前代码只支持 Avalon 的通用房间生命周期和角色分配；完整阿瓦隆任务状态机仍未实现。

如果本文档与代码冲突，以当前代码为准，并同步修正文档。

## 1. 当前已实现范围

已实现：

- `GameType.AVALON`
- Avalon 房间创建、加入、离开、踢人、设置、开局、结束
- 5 到 10 人房间人数边界
- Avalon 角色配置校验
- 开局时随机分配角色并写入 `RoomPlayer.role`
- 开局时创建 `GameRecord`，记录座位号到角色的快照
- 游戏结束时清空玩家角色、房间回到 `WAITING`、未结束的 `GameRecord` 写入 `endedAt`
- REST `GET /api/rooms/:code/my-role` 获取当前用户自己的角色
- `/room` WebSocket namespace 下的通用房间事件

未实现：

- 独立 `AvalonGame`、`AvalonRound`、`AvalonProposal`、投票等数据库模型
- `GET /api/rooms/:code/avalon/state`
- `avalon:*` WebSocket 事件
- 组队、公投、任务执行、刺杀、胜负判定等完整阿瓦隆流程
- 角色视野计算和分发
- 湖中仙女、王者之剑、观战、战绩回放

## 2. 代码入口

| 能力 | 当前文件 |
| --- | --- |
| 房间 REST API | `src/room/room.controller.ts` |
| 房间业务逻辑 | `src/room/room.service.ts` |
| WebSocket 房间同步 | `src/room/room.gateway.ts` |
| Avalon 配置 schema | `src/room/role-config.schema.ts` |
| Avalon 角色分配 | `src/room/role-assigner.ts` |
| 数据模型 | `prisma/schema.prisma` |

## 3. 数据模型

当前 Avalon 复用通用模型。

### 3.1 `Room`

| 字段 | Avalon 说明 |
| --- | --- |
| `gameType` | Avalon 房间写入 `AVALON` |
| `roleConfig` | Avalon 角色配置 JSON |
| `maxPlayers` | 允许 5 到 10 |
| `status` | `WAITING`、`PLAYING`（结束本局后回到 `WAITING`） |

### 3.2 `RoomPlayer`

开局后 `RoomPlayer.role` 保存该玩家自己的角色中文名。公开房间状态不会向其他玩家暴露角色。

### 3.3 `GameRecord`

开局时创建一条记录：

- `roomId` 指向房间
- `roles` 保存 `{ [seatNo]: roleName }`
- `startedAt` 自动写入
- `endedAt` 在结束游戏时写入

当前没有 Avalon 专属对局表。

## 4. 角色配置

Avalon 配置字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `merlin` | Boolean | 梅林 |
| `percival` | Boolean | 派西维尔 |
| `mordred` | Boolean | 莫德雷德 |
| `morgana` | Boolean | 莫甘娜 |
| `oberon` | Boolean | 奥伯伦 |
| `assassin` | Boolean | 刺客 |
| `loyalServants` | Integer | 忠臣数量，0 到 10 |
| `minions` | Integer | 爪牙数量，0 到 10 |

创建房间时如果不传 `roleConfig`，服务端使用 `getDefaultConfig(maxPlayers)`。

默认配置：

| 人数 | 默认配置 |
| --- | --- |
| 5 | 梅林、派西维尔、莫甘娜、刺客、1 忠臣 |
| 6 | 梅林、派西维尔、莫甘娜、刺客、2 忠臣 |
| 7 | 梅林、派西维尔、莫甘娜、奥伯伦、刺客、2 忠臣 |
| 8 | 梅林、派西维尔、莫甘娜、刺客、3 忠臣、1 爪牙 |
| 9 | 梅林、派西维尔、莫德雷德、莫甘娜、刺客、4 忠臣 |
| 10 | 梅林、派西维尔、莫德雷德、莫甘娜、奥伯伦、刺客、4 忠臣 |

服务端校验角色总数必须等于当前房间人数或开局玩家数。角色分配使用 `crypto.randomInt` 洗牌。

## 5. REST API

Avalon 当前复用通用房间接口。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/rooms` | 创建房间；不传 `gameType` 时默认 Avalon |
| `GET` | `/api/rooms/:code` | 获取公开房间状态 |
| `POST` | `/api/rooms/:code/join` | 加入房间 |
| `POST` | `/api/rooms/:code/leave` | 离开房间；游戏中离开会标记离线 |
| `POST` | `/api/rooms/:code/start` | 房主开局并分配角色 |
| `POST` | `/api/rooms/:code/end` | 房主结束游戏，房间回到等待 |
| `POST` | `/api/rooms/:code/kick` | 房主踢人，游戏中不可踢；REST body：`{ "userId": "..." }` |
| `PATCH` / `PUT` | `/api/rooms/:code/settings` | 房主更新人数和角色配置 |
| `GET` | `/api/rooms/:code/my-role` | 游戏中获取自己的角色 |

创建 Avalon 房间示例：

```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "gameType": "AVALON",
  "maxPlayers": 5
}
```

开局限制：

- 只有房主可以开局
- 房间必须处于 `WAITING`
- 当前玩家数至少为 5
- 角色总数必须等于当前玩家数

## 6. WebSocket API

命名空间：

```text
/room
```

客户端事件：

| 事件 | Payload | 说明 |
| --- | --- | --- |
| `room:join` | `{ roomCode }` | 加入或重连房间 |
| `room:leave` | `{ roomCode }` | 离开房间 |
| `room:kick` | `{ roomCode, targetUserId }` | 房主踢人 |
| `room:start` | `{ roomCode }` | 房主开局 |
| `room:end` | `{ roomCode }` | 房主结束游戏 |
| `room:settings-update` | `{ roomCode, roleConfig?, maxPlayers? }` | 更新设置 |
| `player:update` | `{ nickName?, avatarUrl? }` | 更新资料并广播 |

服务端事件：

| 事件 | 说明 |
| --- | --- |
| `room:state` | 公开房间状态，玩家列表不包含角色 |
| `room:started` | 每个用户通过 `user:{userId}` 单播收到 `{ yourRole }` |
| `room:ended` | 游戏结束并回到等待状态 |
| `room:player-joined` | 有玩家加入 |
| `room:player-left` | 有玩家离开或被踢 |
| `room:offline` | 有玩家离线 |
| `room:reconnected` | 有玩家重连 |
| `room:settings-updated` | 设置已更新 |
| `player:updated` | 玩家资料更新 |
| `room:error` | WebSocket 错误 |

## 7. 后续完整 Avalon 实现边界

如果要实现完整阿瓦隆流程，需要新增后端状态机和协议，而不是在现有通用房间事件里硬塞规则判断。建议至少补齐：

- Prisma 模型：`AvalonGame`、`AvalonRound`、`AvalonProposal`、`AvalonProposalVote`、`AvalonMissionVote`
- REST：`GET /api/rooms/:code/avalon/state`
- WS：`avalon:proposal:submit`、`avalon:vote:public`、`avalon:vote:mission`、`avalon:assassinate`、`avalon:*` 广播事件
- 阶段：`ROLE_REVEAL`、`PROPOSAL`、`PUBLIC_VOTE`、`MISSION`、`ROUND_RESULT`、`ASSASSINATE`、`GAME_OVER`
- 规则：5 轮任务、平票否决、同轮 5 次否决判红方胜、3 次任务失败判红方胜、3 次任务成功后进入刺杀
- 玩家视角快照：每个用户只能看到自己的身份、合法视野和当前可操作项

这些能力当前不存在；任何前端或接口文档引用它们时都应标为计划项。
