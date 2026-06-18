我要制作一个可以多人在线游玩的《阿瓦隆》游戏，支持玩家创建房间、加入房间、分配身份、进行发言、组队、投票、执行任务、刺杀梅林、结算胜负等完整流程。

请你从零开始完成：

游戏规则设计
页面交互设计
数据结构设计
前端界面实现
后端逻辑实现
房间与玩家状态同步
身份分配逻辑
游戏流程控制
投票与任务结算
胜负判定
异常情况处理
可扩展的代码架构

请优先保证游戏逻辑正确、流程清晰、代码可维护。

二、游戏背景

这是一个基于《抵抗组织：阿瓦隆》的多人社交推理游戏。

玩家分为两个阵营：

好人阵营
邪恶阵营

好人阵营需要完成足够数量的任务来获得胜利。

邪恶阵营需要让任务失败，或者在好人完成任务后成功刺杀梅林来获胜。

三、支持人数

请支持 5 到 10 人 游戏。

不同人数对应阵营人数如下：

玩家人数 好人数量 坏人数量
5人 3 2
6人 4 2
7人 4 3
8人 5 3
9人 6 3
10人 6 4
四、身份配置

1. 基础身份

好人阵营：

梅林 Merlin
派西维尔 Percival
忠臣 Loyal Servant

邪恶阵营：

莫甘娜 Morgana
刺客 Assassin
爪牙 Minion of Mordred
2. 可选扩展身份

请在架构上支持以下角色，但可以先实现基础身份：

好人阵营：

奥伯伦 Oberon，也可按规则设为邪恶阵营但不被邪恶阵营识别
忠臣

邪恶阵营：

莫德雷德 Mordred
奥伯伦 Oberon
爪牙

注意：标准规则中奥伯伦属于邪恶阵营，但不认识其他坏人，其他坏人也不认识他。

五、身份可见信息规则

游戏开始后，每名玩家应看到不同的信息。

1. 梅林看到的信息

梅林可以看到除莫德雷德以外的邪恶阵营成员。

如果当前局没有莫德雷德，则梅林看到所有邪恶阵营成员。

梅林不能看到奥伯伦，具体是否能看到请按标准规则处理：奥伯伦是邪恶方，但梅林通常可以看到奥伯伦，除非我在配置中关闭。

请将这一点做成可配置项：

merlinCanSeeOberon: true
2. 派西维尔看到的信息

派西维尔可以看到“梅林候选人”。

如果有莫甘娜，则派西维尔看到：

梅林
莫甘娜

但不知道谁是真的梅林。

如果没有莫甘娜，则派西维尔只看到梅林。

1. 邪恶阵营看到的信息

普通邪恶阵营成员可以互相认识。

但是：

奥伯伦看不到其他邪恶阵营成员
其他邪恶阵营成员也看不到奥伯伦
4. 忠臣看到的信息

忠臣不知道任何额外身份信息，只知道自己的身份和阵营。

六、任务人数表

请按照标准阿瓦隆规则实现任务人数。

玩家人数 第1轮 第2轮 第3轮 第4轮 第5轮
5人 2 3 2 3 3
6人 2 3 4 3 4
7人 2 3 3 4 4
8人 3 4 4 5 5
9人 3 4 4 5 5
10人 3 4 4 5 5
七、任务失败规则

默认情况下，只要任务队伍中有至少一名邪恶阵营玩家选择“任务失败”，该任务失败。

特殊规则：

在 7人及以上游戏中，第4轮任务需要至少2张失败票才算任务失败。

请将该规则做成配置项：

twoFailsRequiredOnFourthQuestForSevenPlus: true
八、完整游戏流程

游戏应按以下流程运行：

阶段 1：创建房间

玩家可以创建房间。

房间需要有：

房间 ID
房间名称
房主
最大人数
当前玩家列表
游戏配置
当前状态

房间状态包括：

"waiting" | "role_reveal" | "team_building" | "team_voting" | "quest_action" | "assassination" | "finished"
阶段 2：玩家加入房间

玩家输入昵称后加入房间。

要求：

昵称不能为空
昵称不能重复
房间满员后不能加入
游戏开始后不能加入
玩家掉线后可以重连
阶段 3：房主配置游戏

房主可以配置：

玩家人数
是否启用梅林
是否启用派西维尔
是否启用莫甘娜
是否启用莫德雷德
是否启用奥伯伦
是否启用湖中女神
是否启用公开投票
是否启用匿名任务票
是否允许旁观者
是否开启聊天区
是否开启计时器

基础版默认配置：

{
  "roles": ["Merlin", "Percival", "Morgana", "Assassin"],
  "enableLadyOfTheLake": false,
  "publicTeamVote": true,
  "anonymousQuestVote": true,
  "allowSpectators": false,
  "enableChat": true,
  "enableTimer": false
}
阶段 4：开始游戏

当玩家人数达到 5 到 10 人时，房主可以点击“开始游戏”。

开始游戏时需要：

校验玩家人数是否合法
根据人数和配置生成身份池
洗牌分配身份
设置队长为随机玩家
初始化任务进度
设置当前轮次为第 1 轮
设置当前阶段为身份查看阶段
九、身份池生成规则

请实现一个函数：

generateRoles(playerCount: number, config: GameConfig): Role[]

它需要根据玩家人数和配置生成身份池。

示例：

5人基础局：

梅林
派西维尔
忠臣
莫甘娜
刺客

6人基础局：

梅林
派西维尔
忠臣
忠臣
莫甘娜
刺客

7人基础局：

梅林
派西维尔
忠臣
忠臣
莫甘娜
刺客
爪牙

8人基础局：

梅林
派西维尔
忠臣
忠臣
忠臣
莫甘娜
刺客
爪牙

如果配置中启用莫德雷德、奥伯伦等角色，需要替换部分爪牙或忠臣，保证好坏人数符合规则。

十、队长轮换规则

每一轮任务都有一个队长。

队长负责选择任务队伍。

规则：

初始队长随机
每次组队投票结束后，无论通过还是失败，队长顺时针轮换到下一位玩家
如果组队投票被否决，则仍然换队长重新组队
如果组队投票通过，则执行任务，任务结束后进入下一轮，并由下一个队长继续组队
十一、组队阶段

当前队长需要选择指定数量的玩家组成任务队伍。

要求：

只能由当前队长选择队员
队伍人数必须等于当前轮次要求人数
不能重复选择同一玩家
可以选择自己
选择完成后进入组队投票阶段

需要实现函数：

proposeTeam(leaderId: string, selectedPlayerIds: string[]): void
十二、组队投票阶段

所有玩家对当前任务队伍进行投票。

投票选项：

同意
反对

规则：

所有玩家都必须投票
投票可以公开或隐藏，取决于配置
当所有人投票完成后结算
同意票大于反对票，则队伍通过
否则队伍被否决
连续 5 次组队失败，邪恶阵营直接获胜

需要实现函数：

submitTeamVote(playerId: string, vote: "approve" | "reject"): void

投票结算：

resolveTeamVote(): TeamVoteResult

结果结构：

{
  approved: boolean,
  approvals: number,
  rejections: number,
  votes: Record<PlayerId, "approve" | "reject">,
  rejectedCount: number
}
十三、任务执行阶段

如果组队投票通过，队伍成员进入任务执行阶段。

队伍成员可以提交任务票：

好人阵营只能选择“成功”
邪恶阵营可以选择“成功”或“失败”

注意：

梅林、派西维尔、忠臣等好人不允许提交失败票
只有任务队伍成员可以提交任务票
非队伍成员不能提交任务票
任务票必须匿名结算
不能公开是谁提交了失败票

需要实现函数：

submitQuestAction(playerId: string, action: "success" | "fail"): void

当所有任务队伍成员提交后，结算任务：

resolveQuest(): QuestResult

任务结果结构：

{
  round: number,
  team: PlayerId[],
  successCount: number,
  failCount: number,
  requiredFailCount: number,
  succeeded: boolean
}
十四、任务胜负判定

游戏中共有 5 个任务。

好人阵营完成 3 个成功任务后，进入刺杀阶段
邪恶阵营造成 3 个失败任务后，邪恶阵营直接获胜
如果好人完成 3 个成功任务，刺客可以刺杀梅林
如果刺客刺中梅林，邪恶阵营获胜
如果刺客没有刺中梅林，好人阵营获胜
十五、刺杀阶段

当好人阵营完成 3 个任务后，进入刺杀阶段。

刺客需要选择一个玩家进行刺杀。

规则：

只有刺客可以执行刺杀
刺客不能刺杀自己也可以设为可配置项
刺客可以选择任意玩家
如果刺杀目标是梅林，邪恶阵营获胜
否则好人阵营获胜

请实现函数：

assassinate(assassinId: string, targetPlayerId: string): GameResult

结果结构：

{
  winner: "good" | "evil",
  reason: "merlin_assassinated" | "assassination_failed" | "three_failed_quests",
  assassinatedPlayerId?: string
}
十六、游戏状态结构

请设计清晰的数据结构，推荐使用 TypeScript。

type PlayerId = string;

type Faction = "good" | "evil";

type Role =
  | "Merlin"
  | "Percival"
  | "LoyalServant"
  | "Assassin"
  | "Morgana"
  | "Mordred"
  | "Oberon"
  | "Minion";

type GamePhase =
  | "waiting"
  | "role_reveal"
  | "team_building"
  | "team_voting"
  | "quest_action"
  | "assassination"
  | "finished";

interface Player {
  id: PlayerId;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  role?: Role;
  faction?: Faction;
}

interface GameConfig {
  roles: Role[];
  enableLadyOfTheLake: boolean;
  publicTeamVote: boolean;
  anonymousQuestVote: boolean;
  allowSpectators: boolean;
  enableChat: boolean;
  enableTimer: boolean;
  merlinCanSeeOberon: boolean;
  twoFailsRequiredOnFourthQuestForSevenPlus: boolean;
}

interface QuestHistoryItem {
  round: number;
  team: PlayerId[];
  successCount: number;
  failCount: number;
  requiredFailCount: number;
  succeeded: boolean;
}

interface GameState {
  roomId: string;
  phase: GamePhase;
  players: Player[];
  config: GameConfig;

  leaderIndex: number;
  round: number;
  rejectedTeamVoteCount: number;

  proposedTeam: PlayerId[];
  teamVotes: Record<PlayerId, "approve" | "reject">;
  questActions: Record<PlayerId, "success" | "fail">;

  questHistory: QuestHistoryItem[];

  goodScore: number;
  evilScore: number;

  assassinId?: PlayerId;
  merlinId?: PlayerId;

  winner?: "good" | "evil";
  resultReason?: string;
}
十七、前端页面需求

请实现以下页面或组件。

1. 首页

功能：

输入昵称
创建房间
加入房间
输入房间号
2. 房间等待页

显示：

房间号
玩家列表
房主标识
当前人数
游戏配置
开始游戏按钮

只有房主能修改配置和开始游戏。

1. 身份查看页

每名玩家只能看到自己的身份和对应可见信息。

示例：

梅林看到：

你的身份：梅林
你的阵营：好人
你知道以下玩家是邪恶阵营：

- 玩家A
- 玩家B

派西维尔看到：

你的身份：派西维尔
你的阵营：好人
你看到以下玩家可能是梅林：

- 玩家C
- 玩家D

邪恶阵营看到：

你的身份：刺客
你的阵营：邪恶
你知道以下玩家是你的邪恶同伴：

- 玩家E

忠臣看到：

你的身份：忠臣
你的阵营：好人
你没有额外信息。
4. 游戏主界面

显示：

当前轮次
当前任务人数
当前队长
当前阶段
任务成功 / 失败记录
连续组队失败次数
玩家列表
当前提名队伍
投票状态
操作按钮
5. 队长选人组件

仅当前队长可见或可操作。

需要：

玩家列表复选框
已选人数提示
提交队伍按钮
6. 组队投票组件

所有玩家可操作。

按钮：

同意
反对

投票后显示：

你已投票，等待其他玩家。
7. 任务执行组件

只有任务队伍成员可见。

按钮：

任务成功
任务失败

好人玩家只显示“任务成功”。

坏人玩家显示两个按钮。

1. 刺杀组件

只有刺客可操作。

刺客选择一个玩家刺杀。

1. 游戏结束页

显示：

胜利阵营
胜利原因
所有玩家身份
任务历史
每轮队伍
每轮任务成功 / 失败票数
十八、后端接口设计

请设计 REST API 或 WebSocket 事件。

优先使用 WebSocket，因为游戏需要实时同步。

WebSocket 事件建议

客户端发送：

create_room
join_room
leave_room
start_game
propose_team
submit_team_vote
submit_quest_action
assassinate
send_chat_message
reconnect

服务端广播：

room_updated
game_started
phase_changed
team_proposed
team_vote_updated
team_vote_resolved
quest_action_updated
quest_resolved
assassination_resolved
game_finished
error
十九、安全与防作弊要求

必须注意：

客户端不能拿到所有玩家身份
每个玩家只能收到自己可见的信息
任务票必须匿名
服务器必须校验所有操作是否合法
不能信任客户端传来的身份、阵营、阶段等信息
不能让前端自己判断胜负，必须由服务器判断
掉线重连后只发送该玩家可见的信息
旁观者不能看到隐藏身份
房主不能修改游戏中的身份信息
游戏开始后不能加入新玩家，除非作为旁观者

请实现一个函数：

getPlayerView(gameState: GameState, viewerId: PlayerId): PlayerView

它只返回当前玩家允许看到的信息。

二十、异常处理

请处理以下情况：

玩家掉线
玩家刷新页面
玩家重复加入
房间不存在
房间人数不足
游戏已经开始
非队长提交队伍
队伍人数错误
非队伍成员提交任务票
好人提交失败票
重复投票
重复提交任务票
非刺客提交刺杀
刺杀阶段前提交刺杀
当前阶段不允许该操作
房主离开房间时转移房主
所有玩家离开房间后销毁房间
二十一、游戏配置建议

请提供一套默认配置：

5人推荐配置
梅林、派西维尔、忠臣、莫甘娜、刺客
6人推荐配置
梅林、派西维尔、忠臣、忠臣、莫甘娜、刺客
7人推荐配置
梅林、派西维尔、忠臣、忠臣、莫甘娜、刺客、爪牙
8人推荐配置
梅林、派西维尔、忠臣、忠臣、忠臣、莫甘娜、刺客、爪牙
9人推荐配置
梅林、派西维尔、忠臣、忠臣、忠臣、忠臣、莫甘娜、刺客、爪牙
10人推荐配置
梅林、派西维尔、忠臣、忠臣、忠臣、忠臣、莫甘娜、刺客、爪牙、爪牙
二十二、UI 风格要求

请设计一个清晰、现代、有中世纪幻想感的 UI。

风格关键词：

深色背景
金色边框
羊皮纸质感卡片
圆角按钮
阵营颜色明显
好人阵营使用蓝色或白色
邪恶阵营使用红色或紫色
当前队长高亮
当前任务队伍高亮
已投票状态清晰
移动端适配

页面必须适配：

桌面端
平板
手机
二十三、代码架构要求

请采用清晰的模块化结构。

示例目录：

src/
  server/
    index.ts
    socket.ts
    rooms.ts
    gameEngine.ts
    roleLogic.ts
    visibility.ts
    validators.ts
    types.ts

  client/
    main.tsx
    App.tsx
    pages/
      HomePage.tsx
      LobbyPage.tsx
      GamePage.tsx
      ResultPage.tsx
    components/
      PlayerList.tsx
      RoleCard.tsx
      QuestTracker.tsx
      TeamBuilder.tsx
      TeamVotePanel.tsx
      QuestActionPanel.tsx
      AssassinationPanel.tsx
      ChatBox.tsx
    hooks/
      useSocket.ts
      useGameState.ts
    styles/
      globals.css
二十四、核心函数要求

请重点实现并测试以下函数：

generateRoles(playerCount, config)
assignRoles(players, roles)
getFaction(role)
getVisibleInfo(gameState, playerId)
getQuestTeamSize(playerCount, round)
getRequiredFailCount(playerCount, round)
proposeTeam(gameState, leaderId, selectedPlayerIds)
submitTeamVote(gameState, playerId, vote)
resolveTeamVote(gameState)
submitQuestAction(gameState, playerId, action)
resolveQuest(gameState)
rotateLeader(gameState)
checkWinCondition(gameState)
assassinate(gameState, assassinId, targetPlayerId)
getPlayerView(gameState, viewerId)
二十五、测试要求

请为游戏核心逻辑写单元测试。

至少测试：

5 到 10 人身份数量正确
好坏阵营人数正确
梅林可见信息正确
派西维尔可见信息正确
坏人互认规则正确
奥伯伦不可被坏人识别
莫德雷德不被梅林看到
队伍人数校验正确
非队长不能提交队伍
重复投票被拒绝
投票过半才通过
连续 5 次组队失败邪恶胜利
好人不能提交失败票
任务队员才能提交任务票
第 4 轮双失败规则正确
三个任务成功后进入刺杀阶段
三个任务失败后邪恶直接胜利
刺客刺中梅林邪恶胜利
刺客刺错好人胜利
玩家视角不会泄露隐藏身份
二十六、开发技术栈

请使用以下技术栈实现：

前端：

React
TypeScript
Vite
Tailwind CSS

后端：

Node.js
TypeScript
Express
Socket.IO

测试：

Vitest

如果你认为有更合适的技术栈，可以说明理由，但默认按以上技术栈实现。

二十七、交付要求

请最终交付：

完整项目代码
可运行说明
环境变量说明
游戏规则说明
核心逻辑说明
单元测试
本地启动命令

启动方式希望是：

npm install
npm run dev

服务端和前端可以同时启动。

二十八、实现优先级

请按以下顺序完成：

第一阶段：核心游戏引擎

先实现：

数据结构
身份生成
身份分配
可见信息
队长轮换
组队
投票
任务结算
胜负判断
刺杀逻辑
单元测试
第二阶段：多人房间

再实现：

创建房间
加入房间
房主
房间状态
WebSocket 同步
掉线重连
第三阶段：前端页面

再实现：

首页
房间页
身份页
游戏页
结算页
聊天
移动端适配
第四阶段：优化体验

最后实现：

动画
音效
倒计时
房间二维码
复制房间号
历史记录
观战模式
重新开始一局
二十九、重要规则提醒

请特别注意：

不要把所有玩家身份直接发给前端
不要让客户端自己判断游戏结果
不要让好人提交失败任务票
不要公开任务失败票是谁出的
不要在刺杀阶段前暴露梅林身份
所有关键操作都必须由服务器校验
所有游戏状态变化都必须可追踪、可测试
游戏引擎逻辑应尽量是纯函数，方便测试
三十、请开始执行

请先输出：

项目整体架构
数据模型
游戏状态机
核心规则函数
然后开始生成代码

代码需要完整，不要只给伪代码。
请确保我复制项目后可以运行。
