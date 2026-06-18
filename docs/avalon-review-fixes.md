# 阿瓦隆代码审核修复记录

## 审核概述

使用了 3 个子agent 对代码进行审核：
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
