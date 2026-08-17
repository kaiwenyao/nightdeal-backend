/**
 * WebSocket CORS origin 处理：与 HTTP 侧 main.ts 保持一致。
 *
 * main.ts 会把 CORS_ORIGIN（支持逗号分隔多个来源，如
 * `https://a.com,https://b.com`）split 成数组传给 HTTP CORS。但 Socket.IO 的
 * cors.origin 做的是精确匹配，把逗号分隔的整串传进去将永远匹配不上真实 Origin，
 * 导致配置了多个来源时 WebSocket 连接被拒。这里用同样的 split/trim/filter 逻辑
 * 生成数组，供各网关与 RedisIoAdapter 共用。
 */
export function wsCorsOrigin(): string | string[] | false {
  const raw = process.env.CORS_ORIGIN || '';
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    // 与现有行为一致：未配置时对 WebSocket 关闭 CORS（false）。
    return false;
  }
  return origins;
}