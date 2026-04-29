import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: "User";
    readonly Room: "Room";
    readonly RoomPlayer: "RoomPlayer";
    readonly GameRecord: "GameRecord";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly openId: "openId";
    readonly nickName: "nickName";
    readonly avatarUrl: "avatarUrl";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const RoomScalarFieldEnum: {
    readonly id: "id";
    readonly code: "code";
    readonly hostId: "hostId";
    readonly status: "status";
    readonly roleConfig: "roleConfig";
    readonly maxPlayers: "maxPlayers";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type RoomScalarFieldEnum = (typeof RoomScalarFieldEnum)[keyof typeof RoomScalarFieldEnum];
export declare const RoomPlayerScalarFieldEnum: {
    readonly id: "id";
    readonly roomId: "roomId";
    readonly userId: "userId";
    readonly seatNo: "seatNo";
    readonly role: "role";
    readonly joinedAt: "joinedAt";
};
export type RoomPlayerScalarFieldEnum = (typeof RoomPlayerScalarFieldEnum)[keyof typeof RoomPlayerScalarFieldEnum];
export declare const GameRecordScalarFieldEnum: {
    readonly id: "id";
    readonly roomId: "roomId";
    readonly roles: "roles";
    readonly startedAt: "startedAt";
    readonly endedAt: "endedAt";
};
export type GameRecordScalarFieldEnum = (typeof GameRecordScalarFieldEnum)[keyof typeof GameRecordScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const JsonNullValueInput: {
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
    readonly AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
