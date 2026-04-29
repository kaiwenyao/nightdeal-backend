import * as runtime from "@prisma/client/runtime/index-browser";
export const Decimal = runtime.Decimal;
export const NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
export const DbNull = runtime.DbNull;
export const JsonNull = runtime.JsonNull;
export const AnyNull = runtime.AnyNull;
export const ModelName = {
    User: 'User',
    Room: 'Room',
    RoomPlayer: 'RoomPlayer',
    GameRecord: 'GameRecord'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const UserScalarFieldEnum = {
    id: 'id',
    openId: 'openId',
    nickName: 'nickName',
    avatarUrl: 'avatarUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const RoomScalarFieldEnum = {
    id: 'id',
    code: 'code',
    hostId: 'hostId',
    status: 'status',
    roleConfig: 'roleConfig',
    maxPlayers: 'maxPlayers',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const RoomPlayerScalarFieldEnum = {
    id: 'id',
    roomId: 'roomId',
    userId: 'userId',
    seatNo: 'seatNo',
    role: 'role',
    joinedAt: 'joinedAt'
};
export const GameRecordScalarFieldEnum = {
    id: 'id',
    roomId: 'roomId',
    roles: 'roles',
    startedAt: 'startedAt',
    endedAt: 'endedAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const JsonNullValueInput = {
    JsonNull: JsonNull
};
export const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
export const JsonNullValueFilter = {
    DbNull: DbNull,
    JsonNull: JsonNull,
    AnyNull: AnyNull
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
//# sourceMappingURL=prismaNamespaceBrowser.js.map