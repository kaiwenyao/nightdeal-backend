/**
 * 房间相关的共享常量。
 * 单独成文件，让 room 与 avalon 两个模块都能引用而不产生循环依赖。
 */

/** `room:{code}` 哈希的 TTL（秒）。每次写 lastActiveAt 都要一并续期。 */
export const ROOM_HASH_TTL_SECONDS = 86400;
