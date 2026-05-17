# WeChat Auth Development Guide

本文档描述当前后端微信登录、JWT、session 和头像能力的实现状态。

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
2. 调用微信接口：

```text
https://api.weixin.qq.com/sns/jscode2session
```

3. 使用返回的 `openid` 创建或更新 `User`
4. 签发 JWT
5. 加密 `session_key`
6. 写入 Redis：

```text
session:{userId}
```

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
| `WX_APPID` / `WX_SECRET` 为空，或 `WX_SECRET` 含子串 `placeholder` | 登录失败（`.env.example` 中的 `your_wx_secret_here` **不会**触发占位检测） |

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

其中 `sessionKey` 字段是 AES-256-GCM 加密后的微信 `session_key`，密文格式为：

```text
{iv}:{encrypted}:{authTag}
```

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

服务端也兼容：

```http
Authorization: Bearer <token>
```

连接成功后，socket 会加入：

```text
user:{userId}
```

用于向单个用户发送只属于自己的角色信息。

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
