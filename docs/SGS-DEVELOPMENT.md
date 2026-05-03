# 三国杀身份牌下发系统 - 后端开发文档

## 1. 功能概述

三国杀（SGS）身份牌发放功能允许：
- 房主创建三国杀房间（gameType=SGS）
- 玩家通过房间码加入
- 房主开始游戏后系统自动分配身份牌
- 房主可以重开游戏（重新发牌，房间不解散）
- 游戏进行中或结束后房间保持存在，直到房主主动离开

## 2. 数据库设计

### 2.1 Schema变更

在 `prisma/schema.prisma` 中：

```prisma
enum GameType {
  AVALON
  SGS
}

model Room {
  id         String     @id @default(cuid())
  code       String     @unique @db.VarChar(6)
  hostId     String
  status     RoomStatus @default(WAITING)
  gameType   GameType   @default(AVALON)
  roleConfig Json       @default("{}")
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
```

新增字段：`gameType` (enum GameType) - 区分阿瓦隆(AVALON)和三国杀(SGS)

### 2.2 三国杀角色配置

```typescript
// src/room/sgs-role-assigner.ts

export const SGS_DEFAULT_CONFIGS: Record<number, SgsRoleConfig> = {
  5:  { monarch: 1, loyalist: 1, rebel: 2, traitor: 1 },
  6:  { monarch: 1, loyalist: 1, rebel: 3, traitor: 1 },
  7:  { monarch: 1, loyalist: 2, rebel: 3, traitor: 1 },
  8:  { monarch: 1, loyalist: 2, rebel: 4, traitor: 1 },
  9:  { monarch: 1, loyalist: 2, rebel: 4, traitor: 2 },
  10: { monarch: 1, loyalist: 3, rebel: 4, traitor: 2 },
};
```

## 3. API接口

### 3.1 REST接口

| 方法 | 路径 | 说明 | 请求体 | 鉴权 |
|------|------|------|--------|------|
| POST | `/api/rooms` | 创建房间 | `{ gameType?: 'AVALON' \| 'SGS', roleConfig?: object, maxPlayers?: number }` | 是 |
| POST | `/api/rooms/:code/join` | 加入房间 | - | 是 |
| POST | `/api/rooms/:code/start` | 开始游戏 | - | 是（仅房主） |
| POST | `/api/rooms/:code/restart` | 重开游戏 | - | 是（仅房主） |
| POST | `/api/rooms/:code/leave` | 离开房间 | - | 是 |
| GET | `/api/rooms/:code` | 获取房间信息 | - | 是 |
| GET | `/api/rooms/:code/my-role` | 获取自己的角色 | - | 是 |

### 3.2 WebSocket事件

客户端→服务端：
| 事件 | 说明 |
|------|------|
| `room:join` | 加入房间 |
| `room:leave` | 离开房间 |
| `room:start` | 房主开始游戏 |
| `room:restart` | 房主重开游戏 |

服务端→客户端：
| 事件 | 说明 |
|------|------|
| `room:started` | 游戏开始，单播角色 `{ yourRole: string }` |
| `room:restarted` | 游戏重开，广播通知 |
| `room:state` | 房间状态更新 |
| `room:error` | 错误信息 |

## 4. 核心算法

### 4.1 身份分配

```typescript
// src/room/sgs-role-assigner.ts

export function assignSgsRoles(
  players: { seatNo: number; userId: string }[],
  config?: SgsRoleConfig,
): SgsRoleAssignment[] {
  const playerCount = players.length;
  const resolvedConfig = config ?? getSgsDefaultConfig(playerCount);

  const rolePool = [];
  for (let i = 0; i < resolvedConfig.monarch; i++) rolePool.push({ role: '主公', team: 'monarch' });
  for (let i = 0; i < resolvedConfig.loyalist; i++) rolePool.push({ role: '忠臣', team: 'monarch' });
  for (let i = 0; i < resolvedConfig.rebel; i++) rolePool.push({ role: '反贼', team: 'rebel' });
  for (let i = 0; i < resolvedConfig.traitor; i++) rolePool.push({ role: '内奸', team: 'traitor' });

  // Fisher-Yates shuffle
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

## 5. 房间生命周期

```
WAITING → PLAYING → PLAYING (restart) → PLAYING → ... → FINISHED
   ↑                                          |
   └──────────────────────────────────────────┘
```

- 创建房间时状态为 `WAITING`
- 房主点击"开始游戏"后变为 `PLAYING`
- 游戏中房主可点击"重开"，状态保持 `PLAYING`，重新分配角色
- 所有玩家离开或房主离开后房间被清理

## 6. 测试

### 6.1 运行测试

```bash
# 单元测试
npx jest src/room/sgs-role-assigner.spec.ts

# 所有测试
npx jest --no-coverage
```

### 6.2 测试覆盖

- `sgs-role-assigner.spec.ts` - 身份分配算法测试（11个测试用例）
- `room.service.spec.ts` - 房间服务测试
- `room.controller.spec.ts` - 控制器测试
- `room.gateway.spec.ts` - WebSocket测试

## 7. 文件清单

新增文件：
- `src/room/sgs-role-assigner.ts` - 三国杀身份分配算法
- `src/room/sgs-role-assigner.spec.ts` - 三国杀身份分配测试

修改文件：
- `prisma/schema.prisma` - 添加GameType枚举和room.gameType字段
- `src/room/dto/index.ts` - CreateRoomDto添加gameType
- `src/room/room.service.ts` - 支持SGS游戏类型
- `src/room/room.controller.ts` - 新增restart接口
- `src/room/room.gateway.ts` - 处理room:restart事件
