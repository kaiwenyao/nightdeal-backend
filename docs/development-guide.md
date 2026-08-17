# NightDeal 后端开发文档

本文档合并了原 `docs/` 目录下的所有开发文档，包括微信认证、Avalon 游戏、SGS 游戏、代码审核记录和原始需求规划。

---

# 第一部分：微信认证

## 1. 当前范围

已实现能力：

- 微信小程序 `jscode2session` 登录
- 用户自动创建和资料更新
- 2 小时 JWT 签发和校验
- Redis session 校验
- 微信 `session_key` AES-256-GCM 加密存储
- 服务端头像接收、压缩和上传 OSS

未实现能力：

- 微信手机号解密
- `msgSecCheck` 内容安全检查
- 前端直传 OSS 凭证

## 2. 环境变量

| 变量 | 说明 |
| --- | --- |
| `WX_APPID` | 微信小程序 AppID |
| `WX_SECRET` | 微信小程序 AppSecret |
| `WX_LOGIN_TIMEOUT_MS` | 微信登录请求超时时间 |
| `JWT_SECRET` | JWT 签名密钥 |
| `SESSION_ENCRYPTION_KEY` | 32 字节 AES-256-GCM 加密密钥 |
| `REDIS_URL` | Redis 连接字符串 |
| `OSS_ACCESS_KEY_ID` | 阿里云 OSS AccessKey ID |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS AccessKey Secret |
| `OSS_ENDPOINT` | OSS endpoint |
| `OSS_BUCKET` | OSS bucket |
| `OSS_REGION` | OSS region |
| `OSS_AVATAR_KEY_PREFIX` | 头像对象 key 前缀 |
| `AVATAR_URL_PREFIX` | 头像公开 URL 前缀，也是用户资料头像 URL 白名单前缀 |

`JWT_SECRET` 和 `SESSION_ENCRYPTION_KEY` 在应用启动时都由 Joi 校验为至少 32 个字符。生产环境不要使用示例值或弱口令。

## 3. 登录流程

客户端调用：

```http
POST /api/auth/login
Content-Type: application/json

{
  "code": "wx-login-code"
}
```

服务端流程：

1. 校验 `code`
2. 调用微信接口：`https://api.weixin.qq.com/sns/jscode2session`
3. 使用返回的 `openid` 创建或更新 `User`
4. 签发 JWT
5. 加密 `session_key`
6. 写入 Redis：`session:{userId}`
7. 返回用户和 token

成功响应经过全局响应包装后形如：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "nickName": "",
      "avatarUrl": ""
    }
  }
}
```

`POST /api/auth/login` 当前限流为 5 次/分钟。

## 4. 微信接口错误处理

| 场景 | 当前行为 |
| --- | --- |
| 微信请求超时 | 开发环境 HTTP 504，业务码 `50001`；生产环境 message 为「服务器内部错误」 |
| 网络错误 | 开发环境 HTTP 503，业务码 `50001`；生产环境 message 为「服务器内部错误」 |
| 微信返回 `errcode` | 记录必要日志，向客户端返回泛化登录失败（`50002`） |
| 缺少或非法 `openid` / `session_key` | 视为登录失败 |
| `WX_APPID` / `WX_SECRET` 为空，或 `WX_SECRET` 含子串 `placeholder` | 登录失败（含 `.env.example` 默认值 `your_wx_secret_here`） |

服务端不把微信 `session_key`、`openid` 或微信原始错误细节直接暴露给客户端。

## 5. JWT 和 Session

JWT 配置：

| 项 | 值 |
| --- | --- |
| 算法 | HS256 |
| 过期时间 | 2 小时 |
| Payload | `sub`（用户 ID） |

认证校验流程：

1. 校验 JWT 签名和过期时间
2. 读取 payload 中的 `sub`
3. 检查 Redis 是否存在 `session:{userId}`
4. session 不存在时认证失败

这意味着服务端可以通过删除 Redis session 使 token 提前失效。

## 6. Session Key 加密

微信 `session_key` 不明文落 Redis。当前实现使用：

- 算法：AES-256-GCM
- IV：12 字节随机值
- Auth tag：随密文一起保存
- Redis TTL：7200 秒

Redis value 为 JSON 字符串，例如：

```json
{
  "userId": "user-id",
  "sessionKey": "{iv}:{encrypted}:{authTag}"
}
```

其中 `sessionKey` 字段是 AES-256-GCM 加密后的微信 `session_key`，密文格式为：`{iv}:{encrypted}:{authTag}`

## 7. 用户资料

接口：

```http
POST /api/auth/update-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickName": "Alice",
  "avatarUrl": "https://cdn.example.com/avatars/user-id/avatar.jpg"
}
```

昵称规则：

- 1 到 20 个字符
- 支持中文、英文、数字、下划线、空格、`·`、`.`、`-`

头像 URL 规则：

- 可以为空字符串
- 必须是 HTTPS
- 必须以 `AVATAR_URL_PREFIX` 开头

该限制用于避免用户资料写入任意外部头像地址。

## 8. 头像上传

当前实际使用服务端上传：

```http
POST /api/auth/avatar/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

表单字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `avatar` | File | 用户头像 |

限制：

- 最大 5MB
- MIME 类型只允许 JPEG、PNG、WebP、GIF
- 10 次/分钟限流
- 需要 JWT 认证

处理流程：

1. `FileInterceptor` 接收文件
2. `sharp` 将图片限制到 256x256 内
3. 输出 progressive JPEG
4. 质量从 80 逐步降低到 30，目标不超过 100KB
5. 上传到 OSS
6. 返回公开头像 URL

返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "avatarUrl": "https://cdn.example.com/avatars/user-id/1760000000000.jpg"
  }
}
```

旧接口：

```http
POST /api/auth/avatar/credential
```

该接口当前保留兼容入口，但固定返回 `410 Gone`，不再签发前端直传凭证。

## 9. WebSocket 认证

Socket.IO `/room` namespace 使用同一套 JWT/session 校验。

推荐连接方式：

```ts
io('/room', {
  auth: { token },
  transports: ['websocket'],
});
```

服务端也兼容 `Authorization: Bearer <token>` header。

连接成功后，socket 会加入 `user:{userId}` 房间，用于向单个用户发送只属于自己的角色信息。

## 10. 安全注意事项

- 不要把 `WX_SECRET`、`JWT_SECRET`、`SESSION_ENCRYPTION_KEY` 或 OSS 密钥提交到仓库
- 生产环境必须使用强随机 `JWT_SECRET`
- `JWT_SECRET` 和 `SESSION_ENCRYPTION_KEY` 在启动时都至少 32 个字符（Joi 校验，不通过则启动失败）
- 微信登录错误响应应继续保持泛化，不要向客户端暴露微信原始响应
- 头像 URL 前缀变更时，需要同步检查 `AVATAR_URL_PREFIX` 和 OSS 公开访问策略
- 如果未来加入手机号解密，需要先补齐 session_key 解密读取逻辑和对应测试

## 11. 测试重点

修改认证模块时应覆盖：

- 登录成功和用户 upsert
- 微信接口超时、网络错误、业务错误
- JWT 过期和 Redis session 缺失
- session_key 加密输出格式
- 用户昵称和头像 URL 校验
- 头像 MIME、大小、压缩和 OSS 上传错误
- WebSocket 握手 token 提取和认证失败路径

---

# 第二部分：Avalon 游戏

## 1. 当前已实现范围

已实现：

- `GameType.AVALON` 和 Avalon 房间创建、加入、离开、踢人、设置、开局、结束
- 5 到 10 人房间人数边界和角色配置校验
- 开局时随机分配角色并写入 `RoomPlayer.role`，创建 `GameRecord`
- 游戏结束时清空玩家角色、房间回到 `WAITING`、未结束的 `GameRecord` 写入 `endedAt`
- REST `GET /api/rooms/:code/my-role` 获取当前用户自己的角色
- `/room` WebSocket namespace 下的通用房间事件
- **完整 Avalon 游戏状态机**（`src/avalon/game-engine.ts`）：组队提议、公投投票、任务执行、刺杀、胜负判定
- **角色视野系统**（`src/avalon/visibility.ts`）：梅林、派西维尔、红方、奥伯伦、忠臣各自可见信息
- **Avalon 服务层**（`src/avalon/avalon.service.ts`）：Redis 状态管理、游戏逻辑委托
- **Avalon WebSocket 网关**（`src/avalon/avalon.gateway.ts`）：`/avalon` 命名空间，6 个客户端事件、9 个服务端事件
- **类型定义**（`src/avalon/types.ts`）：8 个角色、7 个游戏阶段、9 个接口、3 个常量表
- **DTO 校验**（`src/avalon/dto/index.ts`）：5 个请求 DTO
- **单元测试**：游戏引擎 50 个用例、视野系统 21 个用例

未实现：

- 计时器/超时逻辑（`enableTimer`、`teamVoteTimeoutSeconds`、`questActionTimeoutSeconds` 已定义但无实现）
- 聊天功能（`enableChat` 已定义但无实现）
- 从 `role_reveal` 到 `team_building` 的自动阶段转换
- 玩家断线重连时的游戏状态自动恢复（需客户端主动调用 `avalon:join`）
- REST 端点查询 Avalon 游戏状态
- 湖中仙女、王者之剑、观战、战绩回放

## 2. 代码入口

| 能力 | 文件 |
| --- | --- |
| Avalon 游戏引擎（纯函数） | `src/avalon/game-engine.ts` |
| 角色视野系统 | `src/avalon/visibility.ts` |
| Avalon 服务层 | `src/avalon/avalon.service.ts` |
| Avalon WebSocket 网关 | `src/avalon/avalon.gateway.ts` |
| 类型定义和常量 | `src/avalon/types.ts` |
| DTO 校验 | `src/avalon/dto/index.ts` |
| 模块定义 | `src/avalon/avalon.module.ts` |
| 房间 REST API | `src/room/room.controller.ts` |
| 房间业务逻辑 | `src/room/room.service.ts` |
| Avalon 配置 schema | `src/room/role-config.schema.ts` |
| Avalon 角色分配 | `src/room/role-assigner.ts` |
| 数据模型 | `prisma/schema.prisma` |

## 3. 数据模型

### 3.1 通用模型（Prisma）

Avalon 复用通用房间模型：

| 模型 | Avalon 说明 |
| --- | --- |
| `Room` | `gameType` 为 `AVALON`，`roleConfig` 为 Avalon 角色配置 JSON，`maxPlayers` 允许 5 到 10 |
| `RoomPlayer` | 开局后 `role` 保存玩家角色中文名，公开状态不暴露 |
| `GameRecord` | 开局时创建，`roles` 保存 `{ [seatNo]: roleName }` 快照 |

### 3.2 Avalon 游戏状态（Redis）

Avalon 游戏状态存储在 Redis，key 为 `avalon:{roomCode}:state`，TTL 为 4 小时。

`AvalonGameState` 接口包含以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `roomId` | string | 房间码 |
| `phase` | GamePhase | 当前游戏阶段 |
| `players` | AvalonPlayer[] | 玩家列表（含角色和阵营） |
| `config` | AvalonGameConfig | 游戏配置 |
| `leaderIndex` | number | 当前队长在玩家列表中的索引 |
| `round` | number | 当前任务轮次（1-5） |
| `rejectedTeamVoteCount` | number | 连续队伍否决次数 |
| `proposedTeam` | string[] | 当前提议的队伍成员 ID |
| `teamVotes` | Record<string, TeamVote> | 队伍投票记录 |
| `questActions` | Record<string, QuestAction> | 任务执行记录 |
| `questHistory` | QuestHistoryItem[] | 已完成的任务历史 |
| `goodScore` | number | 好方得分（任务成功次数） |
| `evilScore` | number | 红方得分（任务失败次数） |
| `assassinId?` | string | 刺客玩家 ID |
| `merlinId?` | string | 梅林玩家 ID |
| `assassinatedPlayerId?` | string | 被刺杀的玩家 ID |
| `winner?` | Winner | 胜方（good/evil） |
| `resultReason?` | ResultReason | 胜负原因 |

## 4. 游戏引擎

游戏引擎位于 `src/avalon/game-engine.ts`，全部为纯函数（无 I/O 依赖），使用 `crypto.randomInt` 进行密码学安全的随机操作。

### 4.1 角色分配

| 函数 | 说明 |
| --- | --- |
| `generateRoles(playerCount, config)` | 根据配置生成角色池，自动填充忠臣/爪牙至玩家数 |
| `assignRoles(players, roles)` | Fisher-Yates 洗牌分配角色 |
| `getFaction(role)` | 返回角色阵营（good/evil） |

### 4.2 任务配置

| 函数 | 说明 |
| --- | --- |
| `getQuestTeamSize(playerCount, round)` | 查询任务队伍人数表 |
| `getRequiredFailCount(playerCount, round, config)` | 查询任务所需失败票数（7+ 人第 4 轮可配置 2 票） |
| `getQuestConfig(playerCount, round, config)` | 返回组合后的任务配置 |

任务队伍人数表（`QUEST_CONFIGS`）：

| 人数 | 第 1 轮 | 第 2 轮 | 第 3 轮 | 第 4 轮 | 第 5 轮 |
| --- | --- | --- | --- | --- | --- |
| 5 | 2 | 3 | 2 | 3 | 3 |
| 6 | 2 | 3 | 4 | 3 | 4 |
| 7 | 2 | 3 | 3 | 4 | 4 |
| 8 | 3 | 4 | 4 | 5 | 5 |
| 9 | 3 | 4 | 4 | 5 | 5 |
| 10 | 3 | 4 | 4 | 5 | 5 |

阵营人数表（`FACTION_COUNTS`）：

| 人数 | 好方 | 红方 |
| --- | --- | --- |
| 5 | 3 | 2 |
| 6 | 4 | 2 |
| 7 | 4 | 3 |
| 8 | 5 | 3 |
| 9 | 6 | 3 |
| 10 | 6 | 4 |

### 4.3 游戏状态操作

| 函数 | 说明 |
| --- | --- |
| `createInitialState(roomId, players, config)` | 创建初始状态（`role_reveal` 阶段，随机队长） |
| `proposeTeam(state, leaderId, selectedPlayerIds)` | 队长提议队伍，校验阶段/队长/人数/去重，转入 `team_voting` |
| `submitTeamVote(state, playerId, vote)` | 提交投票（approve/reject），校验阶段/玩家/重复投票 |
| `resolveTeamVote(state)` | 统计投票：多数通过转入 `quest_action`，否决则队长轮转回 `team_building`，5 次连续否决判红方胜 |
| `submitQuestAction(state, playerId, action)` | 提交任务结果（success/fail），好人不能选 fail |
| `resolveQuest(state)` | 统计任务结果：更新分数，好方 3 次成功进入 `assassination`，红方 3 次成功游戏结束 |
| `assassinate(state, assassinId, targetPlayerId)` | 刺客刺杀：目标是梅林则红方胜，否则好方胜 |
| `checkWinCondition(state)` | 检查胜负条件 |

### 4.4 游戏阶段

```
waiting → role_reveal → team_building → team_voting → quest_action
                                                        ↓
                                              (循环回 team_building)
                                                        ↓
                                              assassination → finished
```

| 阶段 | 说明 |
| --- | --- |
| `role_reveal` | 初始状态，玩家查看自己的角色 |
| `team_building` | 队长提议任务队伍 |
| `team_voting` | 全体投票是否同意该队伍 |
| `quest_action` | 队伍成员执行任务（success/fail） |
| `assassination` | 好方完成 3 次任务后，刺客尝试刺杀梅林 |
| `finished` | 游戏结束 |

### 4.5 胜负条件

| 条件 | 胜方 | 原因码 |
| --- | --- | --- |
| 3 次任务成功 + 刺杀梅林失败 | 好方 | `assassination_failed` |
| 3 次任务成功 + 刺杀梅林成功 | 红方 | `merlin_assassinated` |
| 3 次任务失败 | 红方 | `three_failed_quests` |
| 5 次连续队伍否决 | 红方 | `five_rejected_teams` |

## 5. 角色视野

视野系统位于 `src/avalon/visibility.ts`，根据角色类型过滤可见信息。

### 5.1 角色视野规则

| 角色 | 可见信息 |
| --- | --- |
| 梅林 | 看到除莫德雷德外的所有红方（奥伯伦可配置） |
| 派西维尔 | 看到梅林和莫甘娜为「候选人」（无法区分） |
| 红方（除奥伯伦） | 看到其他红方队友（不包括奥伯伦） |
| 奥伯伦 | 看不到任何红方队友 |
| 忠臣 | 无特殊视野 |

### 5.2 投票可见性

| 配置 | 队伍投票 | 任务投票 |
| --- | --- | --- |
| `publicTeamVote: true` | 所有人可见 | N/A |
| `publicTeamVote: false` | 仅自己可见，他人显示 unknown | N/A |
| `anonymousQuestVote: true` | N/A | 仅统计结果可见 |
| `anonymousQuestVote: false` | N/A | 每人结果可见 |

### 5.3 玩家视角

`getPlayerView(state, viewerId)` 返回的 `PlayerView` 包含：

| 字段 | 说明 |
| --- | --- |
| `myId` | 当前玩家 ID |
| `myRole?` | 当前玩家角色（仅自己可见） |
| `myFaction?` | 当前玩家阵营（仅自己可见） |
| `phase` | 当前游戏阶段 |
| `round` | 当前任务轮次 |
| `leaderId` | 当前队长 ID |
| `goodScore` | 好方得分 |
| `evilScore` | 红方得分 |
| `rejectedTeamVoteCount` | 连续否决次数 |
| `players[]` | 玩家列表（不含他人角色/阵营） |
| `proposedTeam` | 当前提议的队伍 |
| `currentQuestConfig` | 当前任务配置 |
| `visibleInfo` | 该角色可见的特殊信息 |
| `questHistory` | 已完成的任务历史 |
| `gameResult?` | 游戏结束时的胜负信息 |
| `canProposeTeam` | 是否可以提议队伍（仅队长在 team_building 阶段） |
| `canVote` | 是否可以投票（未投票的玩家） |
| `canPerformQuest` | 是否可以执行任务（队伍成员） |
| `canAssassinate` | 是否可以刺杀（仅刺客在 assassination 阶段） |

## 6. Avalon 服务层

服务层位于 `src/avalon/avalon.service.ts`，负责 Redis 状态管理和游戏逻辑委托。

### 6.1 状态管理

| 方法 | 说明 |
| --- | --- |
| `getGameState(roomCode)` | 从 Redis 读取游戏状态 |
| `saveGameState(roomCode, state)` | 保存游戏状态到 Redis（4 小时 TTL） |
| `deleteGameState(roomCode)` | 删除游戏状态 |
| `initializeGame(roomCode, players, config)` | 初始化游戏：生成角色、分配角色、创建初始状态、保存到 Redis |

### 6.2 游戏操作

| 方法 | 说明 |
| --- | --- |
| `proposeTeam(roomCode, leaderId, selectedPlayerIds)` | 委托引擎提议队伍 |
| `submitTeamVote(roomCode, playerId, vote)` | 委托引擎提交投票 |
| `resolveTeamVote(roomCode)` | 委托引擎统计投票，返回结果和所有玩家视角 |
| `submitQuestAction(roomCode, playerId, action)` | 委托引擎提交任务 |
| `resolveQuest(roomCode)` | 委托引擎统计任务，返回结果和所有玩家视角 |
| `assassinate(roomCode, assassinId, targetPlayerId)` | 委托引擎执行刺杀，返回结果和所有玩家视角 |

### 6.3 查询方法

| 方法 | 说明 |
| --- | --- |
| `getPlayerView(roomCode, playerId)` | 获取单个玩家视角 |
| `getAllPlayerViews(roomCode)` | 获取所有玩家视角 |
| `getTeamVoteView(roomCode, playerId)` | 获取投票可见性视图 |
| `getQuestActionView(roomCode, playerId)` | 获取任务执行结果视图 |
| `isTeamVoteComplete(roomCode)` | 检查投票是否完成 |
| `isQuestComplete(roomCode)` | 检查任务是否完成 |
| `getCurrentLeaderId(roomCode)` | 获取当前队长 ID |

### 6.4 玩家连接

| 方法 | 说明 |
| --- | --- |
| `markPlayerOffline(roomCode, playerId)` | 标记玩家离线 |
| `markPlayerOnline(roomCode, playerId)` | 标记玩家在线 |

## 7. WebSocket 网关

网关位于 `src/avalon/avalon.gateway.ts`，命名空间为 `/avalon`。

### 7.1 连接认证

与 `/room` 相同，使用 JWT token 认证：

- 从 `handshake.auth.token` 或 `Authorization` header 读取 token
- 通过 `AuthService.verifyToken()` 验证
- 将连接加入 `user:{userId}` 私有房间
- 维护用户到 socket 的映射

### 7.2 客户端事件

| 事件 | DTO | 说明 |
| --- | --- | --- |
| `avalon:join` | `GetPlayerViewDto` | 加入游戏房间，验证玩家在房间中，加入 `avalon:{roomCode}` Socket.IO 房间 |
| `avalon:leave` | `GetPlayerViewDto` | 离开游戏房间 |
| `avalon:propose-team` | `ProposeTeamDto` | 队长提议队伍，广播状态和阶段变化 |
| `avalon:team-vote` | `SubmitTeamVoteDto` | 投票，广播投票更新；投票完成时解析结果并广播 |
| `avalon:quest-action` | `SubmitQuestActionDto` | 执行任务，广播任务更新；任务完成时解析结果并广播 |
| `avalon:assassinate` | `AssassinateDto` | 刺杀，广播刺杀结果和游戏结束 |

### 7.3 服务端事件

| 事件 | 说明 |
| --- | --- |
| `avalon:state` | 发送给单个玩家的视角状态（通过 `user:{playerId}` 私有通道） |
| `avalon:phase-changed` | 阶段变化通知，包含新阶段和当前回合 |
| `avalon:vote-updated` | 有玩家投票（匿名模式不暴露投票者身份） |
| `avalon:vote-resolved` | 投票结果（公开模式包含所有人投票，匿名模式仅包含统计） |
| `avalon:quest-action-updated` | 有玩家完成任务（仅包含已行动人数/总需人数） |
| `avalon:quest-resolved` | 任务结果（成功/失败、成功票数、失败票数） |
| `avalon:assassination-resolved` | 刺杀结果 |
| `avalon:game-finished` | 游戏结束，包含胜方和原因 |
| `avalon:error` | Avalon 游戏错误 |

### 7.4 广播机制

| 方法 | 说明 |
| --- | --- |
| `broadcastGameState(roomCode)` | 遍历所有玩家，通过 `user:{playerId}` 发送各自的 PlayerView |
| `broadcastVoteUpdate(roomCode, voterId)` | 向房间广播投票更新（匿名模式隐藏投票者身份） |
| `broadcastQuestActionUpdate(roomCode)` | 向房间广播任务执行进度 |
| `sendToPlayer(playerId, event, data)` | 向单个玩家发送事件 |
| `broadcastToRoom(roomCode, event, data)` | 向整个房间广播事件 |

### 7.5 限流

与 `/room` 相同，使用 Redis 计数器限流：

- 10 次/秒/用户
- Redis 失败时拒绝请求
- 未识别用户时以 socket id 作为兜底 key

## 8. 游戏配置

### 8.1 角色配置字段

创建房间时的 `roleConfig` 字段：

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

### 8.2 扩展配置

`AvalonGameConfig` 包含以下可配置项：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `merlinCanSeeOberon` | Boolean | `true` | 梅林是否能看到奥伯伦 |
| `twoFailsRequiredOnFourthQuestForSevenPlus` | Boolean | `true` | 7+ 人第 4 轮任务是否需要 2 票失败 |
| `publicTeamVote` | Boolean | `true` | 投票是否公开 |
| `anonymousQuestVote` | Boolean | `true` | 任务投票是否匿名 |
| `enableChat` | Boolean | `true` | 是否启用聊天（预留，未实现） |
| `enableTimer` | Boolean | `false` | 是否启用计时器（预留，未实现） |
| `teamVoteTimeoutSeconds` | Integer | `60` | 投票超时秒数（预留） |
| `questActionTimeoutSeconds` | Integer | `30` | 任务执行超时秒数（预留） |

## 9. REST API

Avalon 复用通用房间接口，无独立 REST 端点。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/rooms` | 创建房间；`gameType` 默认为 `AVALON` |
| `GET` | `/api/rooms/:code` | 获取公开房间状态 |
| `POST` | `/api/rooms/:code/join` | 加入房间 |
| `POST` | `/api/rooms/:code/leave` | 离开房间；游戏中离开会标记离线 |
| `POST` | `/api/rooms/:code/start` | 房主开局并分配角色 |
| `POST` | `/api/rooms/:code/end` | 房主结束游戏，房间回到等待 |
| `POST` | `/api/rooms/:code/kick` | 房主踢人，游戏中不可踢 |
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

## 10. 测试覆盖

### 10.1 游戏引擎测试

`src/avalon/game-engine.spec.ts` 包含 50 个测试用例：

| 模块 | 测试内容 |
| --- | --- |
| `generateRoles` | 5/6/7/10 人角色生成、无效人数（4/11）抛错、可选角色填充 |
| `assignRoles` | 角色分配正确性、人数不匹配抛错 |
| `getFaction` | 所有 8 个角色的阵营映射 |
| `getQuestTeamSize` | 5/7 人各轮次队伍人数、无效人数和轮次抛错 |
| `getRequiredFailCount` | 默认 1 票失败、7+ 人第 4 轮 2 票失败配置 |
| `proposeTeam` | 成功提议、错误阶段/队长/人数/重复玩家抛错 |
| `submitTeamVote` | 成功投票、错误阶段/玩家/重复投票抛错 |
| `resolveTeamVote` | 多数通过/否决、5 次连续否决结束游戏、未完成投票抛错 |
| `submitQuestAction` | 成功执行、错误阶段/非队员/好人选失败/重复执行抛错 |
| `resolveQuest` | 任务成功/失败、3 次成功进入刺杀、3 次失败结束游戏、未完成抛错 |
| `assassinate` | 刺杀梅林成功/失败、错误阶段/非刺客/目标不存在/自杀抛错 |
| `checkWinCondition` | 进行中返回 null、3 次失败/5 次否决返回红方胜、3 次成功返回 null（需刺杀） |

### 10.2 视野系统测试

`src/avalon/visibility.spec.ts` 包含 21 个测试用例：

| 模块 | 测试内容 |
| --- | --- |
| 梅林视野 | 看到除莫德雷德外的红方、奥伯伦可见性配置 |
| 派西维尔视野 | 看到梅林和莫甘娜为候选人、仅梅林时看到 1 人 |
| 红方视野 | 红方互相可见（不包括奥伯伦）、看不到好方 |
| 奥伯伦视野 | 看不到任何红方队友 |
| 忠臣视野 | 无特殊信息 |
| 队伍投票可见性 | 公开模式所有人可见、匿名模式仅自己可见 |
| 任务结果可见性 | 未完成返回 null、完成返回统计 |
| 玩家视角 | 基本信息、角色隐藏、队长标识、操作权限标志、游戏结果 |

## 11. 开发注意事项

- Avalon 游戏引擎保持纯函数风格，不依赖数据库或 Redis
- 角色分配使用 `crypto.randomInt`，不使用 `Math.random`
- 游戏状态存储在 Redis，TTL 为 4 小时，长时间不活跃的游戏会自动过期
- 每个玩家通过 `user:{playerId}` 私有通道接收自己的视角状态，不包含其他玩家的角色信息
- 修改游戏引擎或视野逻辑时，必须同步更新对应的单元测试
- 新增角色或修改视野规则时，需要检查所有人数下的角色配置默认值

---

# 第三部分：SGS 游戏

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
| `status` | `WAITING`、`PLAYING`（结束本局后回到 `WAITING`） |

创建房间时如果未传 `maxPlayers`，SGS 默认使用 2 人。

### 2.3 RoomPlayer

SGS 开局后会把每个玩家的角色写入 `RoomPlayer.role`。房间公开状态广播不会包含其他玩家角色；每个玩家通过个人事件收到自己的角色。

### 2.4 GameRecord

开局时创建 `GameRecord`，其中 `roles` 保存角色分配快照。结束游戏时，未结束的记录写入 `endedAt`。

## 3. 角色类型和配置字段

`roleConfig` 各字段为**数量**（整数，见 `SgsRoleConfigSchema`）。开局后按数量展开并洗牌，写入 `RoomPlayer.role` 的中文角色名如下：

| 配置字段 | 含义 | 分配角色名 | 阵营 |
| --- | --- | --- | --- |
| `monarch` | 主公数量（0 或 1） | 主公 | `monarch` |
| `loyalist` | 忠臣数量 | 忠臣 | `monarch` |
| `rebel` | 反贼数量 | 反贼 | `rebel` |
| `traitor` | 内奸数量 | 内奸 | `traitor` |

角色分配使用 `crypto.randomInt` 洗牌，不使用 `Math.random`。

## 4. 人数规则

| 游戏 | 默认人数 | 最小人数 | 最大人数 |
| --- | --- | --- | --- |
| SGS | 2 | 2 | 8 |

通用 DTO 的 `maxPlayers` 上限是 10，但 `RoomService` 会继续执行游戏类型级别校验，SGS 超过 8 会被拒绝。

## 5. 角色配置

SGS 配置通过 `SgsRoleConfigSchema` 校验。服务端会在创建房间、更新设置和开局时使用当前配置计算角色分配。

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
  "gameType": "SGS",
  "maxPlayers": 4,
  "roleConfig": {}
}
```

如果不传 `gameType`，默认创建 Avalon 房间。创建 SGS 房间必须传 `gameType: "SGS"`。

### 6.2 更新 SGS 设置

```http
PATCH /api/rooms/:code/settings
Authorization: Bearer <token>
Content-Type: application/json

{
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
- 当前设置接口不切换 `gameType`；SGS 房间必须在创建房间时指定 `gameType: "SGS"`
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
2. 逐个向 `user:{userId}` 发送 `room:started`
3. 再将公开房间状态广播给房间

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
room:state
room:ended
```

## 8. 前端对接

当前小程序端相关页面：

| 页面 | 说明 |
| --- | --- |
| `pages/game-select` | 选择 Avalon 或 SGS |
| `pages/room-settings` | 配置人数和角色（不切换 `gameType`，类型在创建房间时确定） |
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

---

# 第四部分：Avalon 代码审核修复记录

## 审核概述

使用了 3 个子 agent 对代码进行审核：
1. 游戏引擎核心逻辑审核
2. WebSocket 网关和服务审核
3. 前端代码审核

## 修复的问题

### CRITICAL 级别 (6个)

| # | 问题 | 文件 | 修复方式 |
|---|------|------|----------|
| 1 | `roomCode` 变量未定义导致运行时崩溃 | avalon.gateway.ts:329 | 改为 `payload.roomCode` |
| 2 | `auth.userId` 不存在导致前端错误 | avalon.ts:151 | 改为 `auth.profile.id` |
| 3 | WXML 中直接调用 Page 方法（微信小程序不支持） | avalon.wxml | 预计算所有值到 data 中 |
| 4 | 匿名投票配置下投票内容被明文广播 | avalon.gateway.ts:273 | 根据配置脱敏投票数据 |
| 5 | 匿名投票模式下泄露投票者 ID | avalon.gateway.ts:446 | 匿名模式下不暴露 voterId |
| 6 | `assassinatedPlayerId` 永远为 undefined | visibility.ts:81 | 修复三元表达式，添加状态字段 |

### HIGH 级别 (6个)

| # | 问题 | 文件 | 修复方式 |
|---|------|------|----------|
| 1 | `createInitialState` 使用 `Math.random()` | game-engine.ts:239 | 改为使用 `randomInt` |
| 2 | `getLeaderId` 缺少边界检查 | game-engine.ts:658 | 添加空数组和越界检查 |
| 3 | `assassinate` 未验证不能刺杀自己 | game-engine.ts:596 | 添加自刺杀验证 |
| 4 | `assassinate` 未验证不能刺杀邪恶阵营 | game-engine.ts:601 | 添加阵营验证 |
| 5 | `visibleInfo` 缺少空值保护 | avalon.ts:304 | 使用 `state.visibleInfo \|\| {}` |
| 6 | 玩家列表缺少滚动支持 | avalon.wxml | 添加 `scroll-view` 组件 |

### MEDIUM 级别 (4个)

| # | 问题 | 文件 | 修复方式 |
|---|------|------|----------|
| 1 | `resultReason` 非空断言存在风险 | visibility.ts:80 | 改为条件检查 |
| 2 | 刺杀确认弹窗未显示目标名称 | avalon.ts:449 | 预计算并显示目标名称 |
| 3 | 缺少 `getResultReasonText` 函数 | avalon.ts | 添加游戏结果原因文本转换 |
| 4 | 任务历史显示需要预计算 | avalon.ts | 预计算 questHistoryDisplay 和 pendingQuests |

## 代码改进

### 1. 预计算 WXML 所需数据

为了避免在 WXML 中调用 Page 方法，将所有计算逻辑移到 TypeScript 中：

```typescript
// 预计算玩家状态
const playersWithState = state.players.map(p => ({
  ...p,
  isSelected: selectedSet.has(p.id),
  isInTeam: proposedSet.has(p.id),
  isLeader: p.id === state.leaderId,
}))

// 预计算可见信息名称
const merlinSeeNames = (visibleInfo.merlinSees || []).map(id => this.getPlayerName(id, state.players))
```

### 2. 匿名投票保护

在广播投票结果时，根据配置决定是否脱敏：

```typescript
if (isPublicVote) {
  this.server.to(`avalon:${roomCode}`).emit('avalon:vote-resolved', result.result);
} else {
  // 只发送汇总结果，不暴露具体投票
  this.server.to(`avalon:${roomCode}`).emit('avalon:vote-resolved', {
    approved: result.result.approved,
    approvals: result.result.approvals,
    rejections: result.result.rejections,
    rejectedCount: result.result.rejectedCount,
  });
}
```

### 3. 游戏状态类型扩展

添加 `assassinatedPlayerId` 字段到 `AvalonGameState`：

```typescript
export interface AvalonGameState {
  // ... 其他字段
  assassinatedPlayerId?: PlayerId;
}
```

## 待改进项 (未在本次修复)

以下问题已记录但未在本次修复，可在后续迭代中处理：

1. **并发竞态条件** - 需要引入 Redis 事务或分布式锁
2. **Gateway 层二次校验** - 可在 gateway 层增加基本的前置校验
3. **连接数限制** - 可限制单用户最大连接数
4. **JSON.parse 异常保护** - 可添加 try-catch 处理损坏数据
5. **游戏状态 TTL 续期** - 可添加续期机制或超时提醒

## 测试结果

所有 71 个单元测试通过：
- game-engine.spec.ts: 50 tests passed
- visibility.spec.ts: 21 tests passed

---

# 附录：原始需求规划

> 以下为项目初期的需求规划文档，记录了完整的游戏设计规格。当前实现已覆盖大部分核心功能。

## 游戏背景

基于《抵抗组织：阿瓦隆》的多人社交推理游戏。玩家分为好人阵营和邪恶阵营，好人需要完成任务获胜，邪恶需要让任务失败或刺杀梅林获胜。

## 支持人数

5 到 10 人，不同人数对应阵营人数：

| 玩家人数 | 好人数量 | 坏人数量 |
| --- | --- | --- |
| 5人 | 3 | 2 |
| 6人 | 4 | 2 |
| 7人 | 4 | 3 |
| 8人 | 5 | 3 |
| 9人 | 6 | 3 |
| 10人 | 6 | 4 |

## 身份配置

### 基础身份

好人阵营：梅林、派西维尔、忠臣
邪恶阵营：莫甘娜、刺客、爪牙

### 可选扩展身份

好人阵营：奥伯伦、忠臣
邪恶阵营：莫德雷德、奥伯伦、爪牙

标准规则中奥伯伦属于邪恶阵营，但不认识其他坏人，其他坏人也不认识他。

## 身份可见信息规则

1. **梅林**：可以看到除莫德雷德以外的邪恶阵营成员（奥伯伦可配置）
2. **派西维尔**：可以看到「梅林候选人」（梅林 + 莫甘娜），但不知道谁是真梅林
3. **邪恶阵营**：互相认识（不含奥伯伦）
4. **忠臣**：不知道任何额外身份信息

## 任务人数表

| 玩家人数 | 第1轮 | 第2轮 | 第3轮 | 第4轮 | 第5轮 |
| --- | --- | --- | --- | --- | --- |
| 5人 | 2 | 3 | 2 | 3 | 3 |
| 6人 | 2 | 3 | 4 | 3 | 4 |
| 7人 | 2 | 3 | 3 | 4 | 4 |
| 8人 | 3 | 4 | 4 | 5 | 5 |
| 9人 | 3 | 4 | 4 | 5 | 5 |
| 10人 | 3 | 4 | 4 | 5 | 5 |

## 任务失败规则

默认情况下，只要任务队伍中有至少一名邪恶阵营玩家选择「任务失败」，该任务失败。

特殊规则：在 7人及以上游戏中，第4轮任务需要至少2张失败票才算任务失败。

## 完整游戏流程

### 阶段 1：创建房间

玩家可以创建房间，房间需要有：房间 ID、房间名称、房主、最大人数、当前玩家列表、游戏配置、当前状态。

房间状态包括：`waiting` | `role_reveal` | `team_building` | `team_voting` | `quest_action` | `assassination` | `finished`

### 阶段 2：玩家加入房间

玩家输入昵称后加入房间。要求：昵称不能为空、昵称不能重复、房间满员后不能加入、游戏开始后不能加入、玩家掉线后可以重连。

### 阶段 3：房主配置游戏

房主可以配置：玩家人数、是否启用各角色、是否启用湖中女神、是否启用公开投票、是否启用匿名任务票、是否允许旁观者、是否开启聊天区、是否开启计时器。

### 阶段 4：开始游戏

当玩家人数达到 5 到 10 人时，房主可以点击「开始游戏」。开始游戏时需要：校验玩家人数、生成身份池、洗牌分配身份、设置队长为随机玩家、初始化任务进度、设置当前轮次为第 1 轮、设置当前阶段为身份查看阶段。

## 核心函数要求

- `generateRoles(playerCount, config)` - 生成身份池
- `assignRoles(players, roles)` - 分配身份
- `getFaction(role)` - 获取阵营
- `getVisibleInfo(gameState, playerId)` - 获取可见信息
- `getQuestTeamSize(playerCount, round)` - 获取任务队伍人数
- `getRequiredFailCount(playerCount, round)` - 获取所需失败票数
- `proposeTeam(gameState, leaderId, selectedPlayerIds)` - 提议队伍
- `submitTeamVote(gameState, playerId, vote)` - 提交投票
- `resolveTeamVote(gameState)` - 解析投票
- `submitQuestAction(gameState, playerId, action)` - 提交任务
- `resolveQuest(gameState)` - 解析任务
- `rotateLeader(gameState)` - 轮换队长
- `checkWinCondition(gameState)` - 检查胜利条件
- `assassinate(gameState, assassinId, targetPlayerId)` - 刺杀
- `getPlayerView(gameState, viewerId)` - 获取玩家视角

## 安全与防作弊要求

- 客户端不能拿到所有玩家身份
- 每个玩家只能收到自己可见的信息
- 任务票必须匿名
- 服务器必须校验所有操作是否合法
- 不能信任客户端传来的身份、阵营、阶段等信息
- 不能让前端自己判断胜负，必须由服务器判断
- 掉线重连后只发送该玩家可见的信息
- 旁观者不能看到隐藏身份
- 房主不能修改游戏中的身份信息
- 游戏开始后不能加入新玩家，除非作为旁观者

## 实现优先级

### 第一阶段：核心游戏引擎

数据结构、身份生成、身份分配、可见信息、队长轮换、组队、投票、任务结算、胜负判断、刺杀逻辑、单元测试

### 第二阶段：多人房间

创建房间、加入房间、房主、房间状态、WebSocket 同步、掉线重连

### 第三阶段：前端页面

首页、房间页、身份页、游戏页、结算页、聊天、移动端适配

### 第四阶段：优化体验

动画、音效、倒计时、房间二维码、复制房间号、历史记录、观战模式、重新开始一局

## 重要规则提醒

- 不要把所有玩家身份直接发给前端
- 不要让客户端自己判断游戏结果
- 不要让好人提交失败任务票
- 不要公开任务失败票是谁出的
- 不要在刺杀阶段前暴露梅林身份
- 所有关键操作都必须由服务器校验
- 所有游戏状态变化都必须可追踪、可测试
- 游戏引擎逻辑应尽量是纯函数，方便测试
