# 微信小程序登录授权 — 后端实现说明

> 调研对象：在微信小程序内完成"登录 + 获取用户昵称 + 获取用户头像"，并把昵称/头像 URL 持久化到我方数据库。
> 本文针对 **`nightdeal-backend`**（NestJS）仓库，列出**需要实现的内容**。前端对应文档：`nightdeal-minip/docs/wechat-auth.md`。

---

## 1. 背景与政策约束（必读）

### 1.1 微信官方政策

| 时间 | 变更 |
|---|---|
| 2021-04 | 推出 `wx.getUserProfile` 替代 `wx.getUserInfo` |
| **2022-10-25** | **`wx.getUserProfile` 对新版本统一返回灰色默认头像 + "微信用户" 昵称**（来源：微信开放社区官方公告） |
| 2022-10-25 起 | 官方推荐使用"**头像昵称填写能力**"（基础库 ≥ 2.21.2） |
| 基础库 2.24.4 起 | `<input type="nickname">` 在 onBlur 后异步执行违规检测 |

**结论**：在本项目（AppID `***REMOVED_APPID***`，2024 年后创建的新小程序）中，**不存在任何官方接口可以直接拿到 `wx.qlogo.cn` 永久头像 URL**。

### 1.2 头像存储路径决策

需求："头像必须以 URL 形式存库；URL 必须是在线链接；不在我方业务服务器存图片。"

`<button open-type="chooseAvatar">` 回调里拿到的是 **临时本地文件路径**（`wxfile://tmp/...` 或 `http://tmp/...`），路径会过期、跨设备不可用，因此**不能直接写库**。

采纳方案：**前端 `wx.uploadFile` 把临时文件直传阿里云 OSS（对象存储），数据库只保存 OSS 返回的 CDN URL**。我方业务服务器自始至终不持有图片字节流。

### 1.3 整体时序

```
[小程序]                       [Backend]                    [阿里云 OSS]
   |                              |                              |
   |--- wx.login() -> code        |                              |
   |--- POST /auth/login ------->|                               |
   |                              |--- jscode2session ------>    |
   |                              |    （微信开放平台）          |
   |<-- { token, user } ---------|                              |
   |                              |                              |
   |--- chooseAvatar (按钮点击)                                  |
   |    得到 wxfile:// 临时路径                                  |
   |                              |                              |
   |--- POST /auth/avatar/credential ->|                         |
   |<-- { accessKeyId, securityToken, |                          |
   |      bucket, region, host,       |                          |
   |      key, policy, signature }    |                          |
   |                              |                              |
   |--- wx.uploadFile (POST 表单) -----------------------------> |
   |<-- 204 ----------------------------------------------------|
   |    拼出 publicUrl = `${host}/${key}`                        |
   |                              |                              |
   |--- POST /auth/update-profile ->|                            |
   |    { nickName, avatarUrl }     | 校验 url 前缀白名单         |
   |                              | 写库 User.{nickName,avatarUrl}|
   |<-- { user } ----------------|                              |
```

---

## 2. 现状（已完成）✅

代码现状对照（截至本文落地时）：

| 模块 | 文件 | 现状 |
|---|---|---|
| 模块装配 | `src/auth/auth.module.ts` | ✅ |
| 登录控制器 | `src/auth/auth.controller.ts` | ✅ `POST /auth/login`、`POST /auth/update-profile` |
| 登录服务 | `src/auth/auth.service.ts` | ✅ `code2Session` + JWT 签发 + `session_key` AES-256-CBC 加密存 Redis 2h |
| JWT 守卫 | `src/auth/auth.guard.ts` | ✅ Bearer Token 校验 |
| 用户表 | `prisma/schema.prisma` `User` | ✅ `openId`、`nickName`、`avatarUrl`（默认空串） |
| 限流 | `@Throttle({ default: { limit: 10, ttl: 60000 } })` | ✅ 登录 10/min |
| 依赖 | `@nestjs/jwt`、`@nestjs/config`、`ioredis`、`prisma`、`class-validator` | ✅ |

> 现存代码已实现"登录 + 拿到 openId + 写空白 User + 颁发 token"的最短链路。**剩下的所有 TODO 都围绕"头像 URL 的合法落库"和"昵称的合规性"。**

---

## 3. 需实现的内容（TODO）

### 3.1 对象存储模块 `src/storage/`（新增）

**目标**：对 `nightdeal-minip` 暴露一个鉴权后的端点，下发只允许往 `avatars/<userId>/...` 路径 PutObject 的一次性上传凭证。

**选型**：阿里云 OSS。理由：

- 国内可用区低延迟，小程序 `wx.uploadFile` 通过 PostObject 表单上传兼容性好。
- RAM + STS 权限可精确收缩到单 key 前缀；PostObject Policy 可在 Policy 内进一步约束 `key 前缀`、`Content-Length`、`Content-Type`。
- 公网读 URL 形如 `https://<bucket>.oss-<region>.aliyuncs.com/avatars/<userId>/<ts>.jpg`，可直接作为 `<image src>` 使用。

**两种落地方式（任选其一）**：

| 方式 | 说明 | 优点 | 缺点 |
|---|---|---|---|
| **A. PostObject + Policy 签名（推荐）** | 后端用 AccessKey 直接签 PostObject Policy，不走 STS | 实现简单、无 STS 依赖、单次上传无需 RAM 角色配置 | AccessKey 权限范围更广，需谨慎隔离 |
| **B. STS AssumeRole + PostObject** | 后端 `AssumeRole` 拿临时 STS 凭证，再签 Policy | 临时凭证短期有效，更安全 | 需要预先在 RAM 配置子账号 + 角色 + 信任策略 |

下面以 **方式 A**（PostObject + Policy）为基础描述。若选 B，仅需把"AccessKey 签名"换成"STS 临时凭证签名"，调用面与小程序无差别。

**安装依赖**：

```bash
npm i ali-oss
# 若选方式 B，再加：
npm i @alicloud/sts20150401
```

**新增文件**：

```
src/storage/
├── storage.module.ts
├── storage.service.ts          # getAvatarUploadCredential(userId)
├── storage.controller.ts       # （可选）独立挂载，或直接挂在 auth.controller 下
└── dto/
    └── avatar-credential.dto.ts # 出参 schema
```

**Service 接口**：

```ts
interface AvatarUploadCredential {
  // OSS PostObject 表单字段（前端原样塞进 wx.uploadFile.formData）
  accessKeyId: string;        // 普通 AK 或 STS tmp AK
  securityToken?: string;     // 仅方式 B 有值
  policy: string;             // base64(policy json)
  signature: string;          // hmac-sha1(policy, secretKey) base64
  key: string;                // avatars/<userId>/<timestamp>.jpg
  // 上传目标
  bucket: string;
  region: string;             // 如 oss-cn-shanghai
  host: string;               // https://<bucket>.oss-<region>.aliyuncs.com
  expiredTime: number;        // unix 秒
  // 落库时使用
  publicUrl: string;          // `${host}/${key}`
}

class StorageService {
  async getAvatarUploadCredential(userId: string): Promise<AvatarUploadCredential>;
}
```

**PostObject Policy**（关键约束，base64 前的 JSON）：

```jsonc
{
  "expiration": "2026-05-01T00:30:00.000Z",
  "conditions": [
    { "bucket": "<bucket>" },
    [ "starts-with", "$key", "avatars/<userId>/" ],
    [ "content-length-range", 0, 2097152 ],
    [ "starts-with", "$Content-Type", "image/" ]
  ]
}
```

- `$key` 必须以 `avatars/<userId>/` 开头，**禁止跨用户写**。
- `content-length-range` 限定 ≤2MB。
- `Content-Type` 必须以 `image/` 开头，避免被传成可执行文件。
- Policy `expiration` 建议 5–10 分钟（绝对时间）。
- 服务端用 `secretKey` 对 base64 后的 policy 做 HMAC-SHA1，base64 输出作为 `signature`。

**RAM 子账号建议**（方式 A）：单独创建一个仅有 `oss:PutObject` 到 `avatars/*` 路径权限的 RAM 子账号，AK/SK 入 `.env`，与项目主账号隔离。

**新增端点**：

| Method | Path | Guard | 说明 |
|---|---|---|---|
| `POST` | `/auth/avatar/credential` | `AuthGuard` | 已登录用户请求一次性上传凭证 |

挂载位置二选一：

- 独立 `StorageController`（推荐，未来可扩展到房间封面等）
- 直接复用 `AuthController`（最快落地）

### 3.2 头像 URL 域名白名单校验

**问题**：当前 `UpdateProfileDto.avatarUrl` 仅 `@IsString()`，前端传 `wxfile://tmp/...`、`http://attacker.com/x.jpg` 都会被吞下入库。

**修改文件**：`src/auth/dto/update-profile.dto.ts`

```ts
import { IsString, IsOptional, Length, MaxLength, Validate } from 'class-validator';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isAvatarUrl', async: false })
class IsAvatarUrl implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.length === 0) return true; // 空串放行（保留原值）
    if (!value.startsWith('https://')) return false;
    const prefix = process.env.AVATAR_URL_PREFIX || '';
    return prefix.length > 0 && value.startsWith(prefix);
  }
  defaultMessage(): string {
    return 'avatarUrl 必须是我方 OSS 域名下的 https URL';
  }
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(1, 20)
  nickName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  @Validate(IsAvatarUrl)
  avatarUrl?: string;
}
```

**配置项**：

- `AVATAR_URL_PREFIX=https://nightdeal.oss-cn-shanghai.aliyuncs.com/avatars/`

**显式拒绝**：

- `wxfile://`、`http://tmp/`、`http://usr/`
- 任何非 https
- 任何不以白名单前缀开头的 URL

### 3.3 昵称合规与二次安检

**问题**：

- 前端 `<input type="nickname">` 在 2.24.4+ 会做异步安检，但**前端检查不可信**，必须服务端兜底。
- 微信 `security.msgSecCheck` v2 接口可对昵称文本做合规检测。

**改动**：

1. `UpdateProfileDto.nickName`：`@Length(1, 20)`、Pipe 中 trim、禁纯空白。
2. 新增 `src/wx/wx-access-token.service.ts`：缓存 access_token 到 Redis（key `wx:access_token`，TTL 7000s，留余量）。
3. 新增 `src/wx/wx-msg-sec-check.service.ts`：
   - 调用 `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=...`
   - 入参 `{ openid, scene: 1, content: nickName, version: 2 }`（scene=1 是资料类）
   - 返回 `{ result: { suggest: 'pass' | 'review' | 'risky' } }`
4. `AuthService.updateProfile` 中：若 `nickName` 命中 `risky`，抛 `UnprocessableEntityException`，前端按错误矩阵处理。
5. 灰度开关 `WX_MSG_SEC_CHECK_ENABLED=true|false`，本地开发可关。

### 3.4 配置（`.env`）

新增以下变量（不要提交真实值，更新 `.env.example`）：

```env
# 阿里云 OSS — 仅服务端使用，签 PostObject Policy 用
# 强烈建议用一个仅授予 oss:PutObject 到 avatars/* 路径的 RAM 子账号 AK
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=nightdeal
OSS_REGION=oss-cn-shanghai
OSS_AVATAR_KEY_PREFIX=avatars/

# 若选方式 B（STS），还需：
# OSS_STS_ROLE_ARN=acs:ram::<uid>:role/<role-name>
# OSS_STS_ROLE_SESSION_NAME=nightdeal-avatar

# 入库白名单（落库前缀校验）
AVATAR_URL_PREFIX=https://nightdeal.oss-cn-shanghai.aliyuncs.com/avatars/

# 内容安全
WX_MSG_SEC_CHECK_ENABLED=true
```

### 3.5 测试覆盖

| 类型 | 用例 |
|---|---|
| Unit | `StorageService.getAvatarUploadCredential` → key 形如 `avatars/<userId>/<ts>.jpg`，policy expiration ≤10min |
| Unit | `StorageService` → 签出的 signature 用同一 secretKey 验签可对得上（HMAC-SHA1） |
| Unit | `IsAvatarUrl` validator → 拒 wxfile://、http://、跨域名 https |
| Unit | `WxMsgSecCheckService` → mock fetch 返回 risky 时 throw |
| Integration | `POST /auth/update-profile` 传 `wxfile://x` → 400 |
| Integration | `POST /auth/update-profile` 传合规 OSS URL → 200 + DB 写入 |
| E2E | login → credential → 真实 PostObject mock → update-profile → DB.avatarUrl 形如 `https://*.aliyuncs.com/avatars/...` |

---

## 4. 字段约定

| 字段 | 类型 | 限制 | 来源 |
|---|---|---|---|
| `openId` | string | 微信侧不可变 ID | `jscode2session` |
| `nickName` | string | 1–20 字符；`security.msgSecCheck` v2 通过 | 前端 `<input type=nickname>` 提交 |
| `avatarUrl` | string | https；以 `AVATAR_URL_PREFIX`（OSS bucket 域名）开头；≤512 | 前端 `wx.uploadFile` 后回填 |

`avatarUrl` 允许空串，表示用户未上传头像，前端渲染默认头像。

---

## 5. 不做的事（明确边界）

- ❌ 不接 `unionId`（除非未来跨小程序/公众号互认有需求）。
- ❌ 不做手机号绑定（`getPhoneNumber`）— 与本次任务无关。
- ❌ 不在我方业务服务器存任何头像字节流；不做 base64 入库；不做图片代理转发。
- ❌ 不做头像内容审核（可后续接入阿里云内容安全 / OSS 图片审核扫描）。
- ❌ 不在小程序端硬编码任何 AccessKeySecret；签名必须由后端完成。

---

## 6. 引用资料

- 微信开放社区公告 _关于小程序 wx.getUserInfo 与 wx.getUserProfile 接口调整_（restriction date 2022-10-25）
- 微信开发者文档 / 头像昵称填写能力（基础库 ≥ 2.21.2；2.24.4 起 nickname onBlur 异步安检）
- 微信开发者文档 / `security.msgSecCheck` v2
- 阿里云 OSS / PostObject 表单上传 / 服务端 Policy 签名 / RAM STS（可选）

---

## 7. 实施次序建议

1. 3.4 配置先行，开通 OSS bucket（公网读、私写）、创建专用 RAM 子账号 AK 仅授予 `oss:PutObject` 到 `avatars/*`。
2. 3.1 StorageModule（PostObject Policy 签名）— 单元测试通过；用 curl POST 一张测试图片打通链路。
3. 3.2 DTO 校验 — 立即提升安全水位，可独立合并。
4. 3.3 内容安检（可放在第二个 PR，灰度上）。
5. 联调阶段配合前端 `nightdeal-minip/docs/wechat-auth.md` §4.1–4.2。
