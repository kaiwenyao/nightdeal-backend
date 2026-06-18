# 阿瓦隆游戏实现文档

## 概述

本文档描述了阿瓦隆（Avalon）游戏的完整实现，包括后端游戏引擎、WebSocket 通信和前端界面。

## 实现内容

### 1. 后端游戏引擎 (`nightdeal-backend/src/avalon/`)

#### 1.1 类型定义 (`types.ts`)
- 定义了所有游戏相关的类型
- 包括角色、阵营、游戏阶段、配置等
- 支持 5-10 人游戏

#### 1.2 游戏引擎 (`game-engine.ts`)
核心纯函数实现：
- `generateRoles()` - 根据玩家人数和配置生成角色池
- `assignRoles()` - 洗牌分配角色给玩家
- `getFaction()` - 获取角色所属阵营
- `proposeTeam()` - 队长提议任务队伍
- `submitTeamVote()` - 玩家提交组队投票
- `resolveTeamVote()` - 解析投票结果
- `submitQuestAction()` - 提交任务行动（成功/失败）
- `resolveQuest()` - 解析任务结果
- `assassinate()` - 刺杀梅林
- `checkWinCondition()` - 检查胜利条件

#### 1.3 可见性逻辑 (`visibility.ts`)
实现玩家视角控制：
- 梅林：可以看到除莫德雷德外的邪恶阵营（奥伯伦可配置）
- 派西维尔：可以看到梅林候选人（梅林 + 莫甘娜）
- 邪恶阵营：互相认识（不含奥伯伦）
- 奥伯伦：不认识其他邪恶阵营，也不被认识
- 忠臣：没有额外信息

#### 1.4 游戏服务 (`avalon.service.ts`)
管理游戏状态：
- 使用 Redis 存储游戏状态
- 处理游戏流程控制
- 提供状态查询和操作接口

#### 1.5 WebSocket 网关 (`avalon.gateway.ts`)
处理实时通信：
- `avalon:join` - 加入游戏房间
- `avalon:leave` - 离开游戏房间
- `avalon:propose-team` - 提议任务队伍
- `avalon:team-vote` - 组队投票
- `avalon:quest-action` - 执行任务
- `avalon:assassinate` - 刺杀梅林

### 2. 前端界面 (`nightdeal-minip/miniprogram/pages/avalon/`)

#### 2.1 页面结构 (`avalon.wxml`)
- 顶部信息栏：显示轮次、阶段、得分
- 任务历史：显示各轮任务结果
- 角色信息面板：显示角色和可见信息
- 玩家列表：显示所有玩家状态
- 操作面板：根据阶段显示不同操作

#### 2.2 页面样式 (`avalon.wxss`)
中世纪幻想风格：
- 深色背景
- 金色边框
- 阵营颜色区分（好人蓝色，邪恶红色）

#### 2.3 页面逻辑 (`avalon.ts`)
- Socket 连接管理
- 游戏状态更新
- 用户操作处理
- UI 状态控制

### 3. 测试覆盖

#### 3.1 游戏引擎测试 (`game-engine.spec.ts`)
- 角色分配测试（5-10人）
- 任务配置测试
- 组队、投票、任务、刺杀逻辑测试
- 胜利条件测试

#### 3.2 可见性测试 (`visibility.spec.ts`)
- 梅林可见性测试
- 派西维尔可见性测试
- 邪恶阵营可见性测试
- 奥伯伦可见性测试
- 投票和任务视图测试

## 游戏流程

### 1. 等待阶段
- 玩家加入房间
- 房主配置游戏
- 房主开始游戏

### 2. 身份揭示阶段
- 系统分配角色
- 每个玩家查看自己的身份和可见信息

### 3. 组队阶段
- 队长选择任务队员
- 队伍人数由当前轮次决定

### 4. 投票阶段
- 所有玩家投票决定是否通过队伍
- 超过半数同意则通过
- 连续5次否决则邪恶获胜

### 5. 任务执行阶段
- 队伍成员提交任务票
- 好人只能提交成功
- 邪恶可以提交成功或失败
- 根据失败票数决定任务成败

### 6. 刺杀阶段（好人完成3个任务后）
- 刺客选择一个玩家刺杀
- 如果刺中梅林，邪恶获胜
- 如果刺错，好人获胜

## 配置选项

```typescript
interface AvalonGameConfig {
  roles: AvalonRole[];                    // 启用的角色
  merlinCanSeeOberon: boolean;            // 梅林是否能看到奥伯伦
  twoFailsRequiredOnFourthQuestForSevenPlus: boolean; // 7人以上第4轮需要两张失败票
  publicTeamVote: boolean;                // 是否公开投票
  anonymousQuestVote: boolean;            // 是否匿名任务票
  enableChat: boolean;                    // 是否启用聊天
  enableTimer: boolean;                   // 是否启用计时器
  teamVoteTimeoutSeconds: number;         // 投票超时时间
  questActionTimeoutSeconds: number;      // 任务超时时间
}
```

## 启动方式

```bash
# 后端
cd nightdeal-backend
npm install
npm run dev

# 前端（微信小程序）
# 使用微信开发者工具打开 nightdeal-minip 目录
```

## 技术栈

- **后端**: NestJS + Socket.IO + Redis + Prisma
- **前端**: 微信小程序
- **测试**: Jest

## 注意事项

1. 所有游戏逻辑都在服务端处理，防止作弊
2. 每个玩家只能看到自己允许看到的信息
3. 任务票匿名，不透露是谁提交的失败票
4. 游戏状态使用 Redis 存储，支持断线重连
