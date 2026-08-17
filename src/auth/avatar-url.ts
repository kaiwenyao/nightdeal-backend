/**
 * Allow empty string (clear avatar). Non-empty URLs must share the configured
 * OSS origin and sit under its path — a raw startsWith check would accept
 * `https://oss.example.com.evil.com/...` when the prefix has no trailing slash.
 */
export function isAllowedAvatarUrl(url: string, prefix: string | undefined): boolean {
  if (url === '') return true;
  if (!prefix) return false;
  try {
    const allowed = new URL(prefix.endsWith('/') ? prefix : `${prefix}/`);
    const candidate = new URL(url);
    if (candidate.protocol !== 'https:') return false;
    if (candidate.username || candidate.password) return false;
    if (candidate.host !== allowed.host) return false;
    const allowedPath = allowed.pathname.endsWith('/')
      ? allowed.pathname
      : `${allowed.pathname}/`;
    return candidate.pathname.startsWith(allowedPath);
  } catch {
    return false;
  }
}
