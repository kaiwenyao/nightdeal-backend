import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type RoomModel = runtime.Types.Result.DefaultSelection<Prisma.$RoomPayload>;
export type AggregateRoom = {
    _count: RoomCountAggregateOutputType | null;
    _avg: RoomAvgAggregateOutputType | null;
    _sum: RoomSumAggregateOutputType | null;
    _min: RoomMinAggregateOutputType | null;
    _max: RoomMaxAggregateOutputType | null;
};
export type RoomAvgAggregateOutputType = {
    maxPlayers: number | null;
};
export type RoomSumAggregateOutputType = {
    maxPlayers: number | null;
};
export type RoomMinAggregateOutputType = {
    id: string | null;
    code: string | null;
    hostId: string | null;
    status: $Enums.RoomStatus | null;
    maxPlayers: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type RoomMaxAggregateOutputType = {
    id: string | null;
    code: string | null;
    hostId: string | null;
    status: $Enums.RoomStatus | null;
    maxPlayers: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type RoomCountAggregateOutputType = {
    id: number;
    code: number;
    hostId: number;
    status: number;
    roleConfig: number;
    maxPlayers: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type RoomAvgAggregateInputType = {
    maxPlayers?: true;
};
export type RoomSumAggregateInputType = {
    maxPlayers?: true;
};
export type RoomMinAggregateInputType = {
    id?: true;
    code?: true;
    hostId?: true;
    status?: true;
    maxPlayers?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type RoomMaxAggregateInputType = {
    id?: true;
    code?: true;
    hostId?: true;
    status?: true;
    maxPlayers?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type RoomCountAggregateInputType = {
    id?: true;
    code?: true;
    hostId?: true;
    status?: true;
    roleConfig?: true;
    maxPlayers?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type RoomAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoomWhereInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput | Prisma.RoomOrderByWithRelationInput[];
    cursor?: Prisma.RoomWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RoomCountAggregateInputType;
    _avg?: RoomAvgAggregateInputType;
    _sum?: RoomSumAggregateInputType;
    _min?: RoomMinAggregateInputType;
    _max?: RoomMaxAggregateInputType;
};
export type GetRoomAggregateType<T extends RoomAggregateArgs> = {
    [P in keyof T & keyof AggregateRoom]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRoom[P]> : Prisma.GetScalarType<T[P], AggregateRoom[P]>;
};
export type RoomGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoomWhereInput;
    orderBy?: Prisma.RoomOrderByWithAggregationInput | Prisma.RoomOrderByWithAggregationInput[];
    by: Prisma.RoomScalarFieldEnum[] | Prisma.RoomScalarFieldEnum;
    having?: Prisma.RoomScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RoomCountAggregateInputType | true;
    _avg?: RoomAvgAggregateInputType;
    _sum?: RoomSumAggregateInputType;
    _min?: RoomMinAggregateInputType;
    _max?: RoomMaxAggregateInputType;
};
export type RoomGroupByOutputType = {
    id: string;
    code: string;
    hostId: string;
    status: $Enums.RoomStatus;
    roleConfig: runtime.JsonValue;
    maxPlayers: number;
    createdAt: Date;
    updatedAt: Date;
    _count: RoomCountAggregateOutputType | null;
    _avg: RoomAvgAggregateOutputType | null;
    _sum: RoomSumAggregateOutputType | null;
    _min: RoomMinAggregateOutputType | null;
    _max: RoomMaxAggregateOutputType | null;
};
export type GetRoomGroupByPayload<T extends RoomGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RoomGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RoomGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RoomGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RoomGroupByOutputType[P]>;
}>>;
export type RoomWhereInput = {
    AND?: Prisma.RoomWhereInput | Prisma.RoomWhereInput[];
    OR?: Prisma.RoomWhereInput[];
    NOT?: Prisma.RoomWhereInput | Prisma.RoomWhereInput[];
    id?: Prisma.StringFilter<"Room"> | string;
    code?: Prisma.StringFilter<"Room"> | string;
    hostId?: Prisma.StringFilter<"Room"> | string;
    status?: Prisma.EnumRoomStatusFilter<"Room"> | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonFilter<"Room">;
    maxPlayers?: Prisma.IntFilter<"Room"> | number;
    createdAt?: Prisma.DateTimeFilter<"Room"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Room"> | Date | string;
    host?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    players?: Prisma.RoomPlayerListRelationFilter;
    games?: Prisma.GameRecordListRelationFilter;
};
export type RoomOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    hostId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    roleConfig?: Prisma.SortOrder;
    maxPlayers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    host?: Prisma.UserOrderByWithRelationInput;
    players?: Prisma.RoomPlayerOrderByRelationAggregateInput;
    games?: Prisma.GameRecordOrderByRelationAggregateInput;
};
export type RoomWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    code?: string;
    AND?: Prisma.RoomWhereInput | Prisma.RoomWhereInput[];
    OR?: Prisma.RoomWhereInput[];
    NOT?: Prisma.RoomWhereInput | Prisma.RoomWhereInput[];
    hostId?: Prisma.StringFilter<"Room"> | string;
    status?: Prisma.EnumRoomStatusFilter<"Room"> | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonFilter<"Room">;
    maxPlayers?: Prisma.IntFilter<"Room"> | number;
    createdAt?: Prisma.DateTimeFilter<"Room"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Room"> | Date | string;
    host?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    players?: Prisma.RoomPlayerListRelationFilter;
    games?: Prisma.GameRecordListRelationFilter;
}, "id" | "code">;
export type RoomOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    hostId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    roleConfig?: Prisma.SortOrder;
    maxPlayers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.RoomCountOrderByAggregateInput;
    _avg?: Prisma.RoomAvgOrderByAggregateInput;
    _max?: Prisma.RoomMaxOrderByAggregateInput;
    _min?: Prisma.RoomMinOrderByAggregateInput;
    _sum?: Prisma.RoomSumOrderByAggregateInput;
};
export type RoomScalarWhereWithAggregatesInput = {
    AND?: Prisma.RoomScalarWhereWithAggregatesInput | Prisma.RoomScalarWhereWithAggregatesInput[];
    OR?: Prisma.RoomScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RoomScalarWhereWithAggregatesInput | Prisma.RoomScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Room"> | string;
    code?: Prisma.StringWithAggregatesFilter<"Room"> | string;
    hostId?: Prisma.StringWithAggregatesFilter<"Room"> | string;
    status?: Prisma.EnumRoomStatusWithAggregatesFilter<"Room"> | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonWithAggregatesFilter<"Room">;
    maxPlayers?: Prisma.IntWithAggregatesFilter<"Room"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Room"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Room"> | Date | string;
};
export type RoomCreateInput = {
    id?: string;
    code: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    host: Prisma.UserCreateNestedOneWithoutHostedRoomsInput;
    players?: Prisma.RoomPlayerCreateNestedManyWithoutRoomInput;
    games?: Prisma.GameRecordCreateNestedManyWithoutRoomInput;
};
export type RoomUncheckedCreateInput = {
    id?: string;
    code: string;
    hostId: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    players?: Prisma.RoomPlayerUncheckedCreateNestedManyWithoutRoomInput;
    games?: Prisma.GameRecordUncheckedCreateNestedManyWithoutRoomInput;
};
export type RoomUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    host?: Prisma.UserUpdateOneRequiredWithoutHostedRoomsNestedInput;
    players?: Prisma.RoomPlayerUpdateManyWithoutRoomNestedInput;
    games?: Prisma.GameRecordUpdateManyWithoutRoomNestedInput;
};
export type RoomUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    hostId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    players?: Prisma.RoomPlayerUncheckedUpdateManyWithoutRoomNestedInput;
    games?: Prisma.GameRecordUncheckedUpdateManyWithoutRoomNestedInput;
};
export type RoomCreateManyInput = {
    id?: string;
    code: string;
    hostId: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RoomUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    hostId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomListRelationFilter = {
    every?: Prisma.RoomWhereInput;
    some?: Prisma.RoomWhereInput;
    none?: Prisma.RoomWhereInput;
};
export type RoomOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type RoomCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    hostId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    roleConfig?: Prisma.SortOrder;
    maxPlayers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RoomAvgOrderByAggregateInput = {
    maxPlayers?: Prisma.SortOrder;
};
export type RoomMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    hostId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    maxPlayers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RoomMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    code?: Prisma.SortOrder;
    hostId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    maxPlayers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RoomSumOrderByAggregateInput = {
    maxPlayers?: Prisma.SortOrder;
};
export type RoomScalarRelationFilter = {
    is?: Prisma.RoomWhereInput;
    isNot?: Prisma.RoomWhereInput;
};
export type RoomCreateNestedManyWithoutHostInput = {
    create?: Prisma.XOR<Prisma.RoomCreateWithoutHostInput, Prisma.RoomUncheckedCreateWithoutHostInput> | Prisma.RoomCreateWithoutHostInput[] | Prisma.RoomUncheckedCreateWithoutHostInput[];
    connectOrCreate?: Prisma.RoomCreateOrConnectWithoutHostInput | Prisma.RoomCreateOrConnectWithoutHostInput[];
    createMany?: Prisma.RoomCreateManyHostInputEnvelope;
    connect?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
};
export type RoomUncheckedCreateNestedManyWithoutHostInput = {
    create?: Prisma.XOR<Prisma.RoomCreateWithoutHostInput, Prisma.RoomUncheckedCreateWithoutHostInput> | Prisma.RoomCreateWithoutHostInput[] | Prisma.RoomUncheckedCreateWithoutHostInput[];
    connectOrCreate?: Prisma.RoomCreateOrConnectWithoutHostInput | Prisma.RoomCreateOrConnectWithoutHostInput[];
    createMany?: Prisma.RoomCreateManyHostInputEnvelope;
    connect?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
};
export type RoomUpdateManyWithoutHostNestedInput = {
    create?: Prisma.XOR<Prisma.RoomCreateWithoutHostInput, Prisma.RoomUncheckedCreateWithoutHostInput> | Prisma.RoomCreateWithoutHostInput[] | Prisma.RoomUncheckedCreateWithoutHostInput[];
    connectOrCreate?: Prisma.RoomCreateOrConnectWithoutHostInput | Prisma.RoomCreateOrConnectWithoutHostInput[];
    upsert?: Prisma.RoomUpsertWithWhereUniqueWithoutHostInput | Prisma.RoomUpsertWithWhereUniqueWithoutHostInput[];
    createMany?: Prisma.RoomCreateManyHostInputEnvelope;
    set?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
    disconnect?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
    delete?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
    connect?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
    update?: Prisma.RoomUpdateWithWhereUniqueWithoutHostInput | Prisma.RoomUpdateWithWhereUniqueWithoutHostInput[];
    updateMany?: Prisma.RoomUpdateManyWithWhereWithoutHostInput | Prisma.RoomUpdateManyWithWhereWithoutHostInput[];
    deleteMany?: Prisma.RoomScalarWhereInput | Prisma.RoomScalarWhereInput[];
};
export type RoomUncheckedUpdateManyWithoutHostNestedInput = {
    create?: Prisma.XOR<Prisma.RoomCreateWithoutHostInput, Prisma.RoomUncheckedCreateWithoutHostInput> | Prisma.RoomCreateWithoutHostInput[] | Prisma.RoomUncheckedCreateWithoutHostInput[];
    connectOrCreate?: Prisma.RoomCreateOrConnectWithoutHostInput | Prisma.RoomCreateOrConnectWithoutHostInput[];
    upsert?: Prisma.RoomUpsertWithWhereUniqueWithoutHostInput | Prisma.RoomUpsertWithWhereUniqueWithoutHostInput[];
    createMany?: Prisma.RoomCreateManyHostInputEnvelope;
    set?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
    disconnect?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
    delete?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
    connect?: Prisma.RoomWhereUniqueInput | Prisma.RoomWhereUniqueInput[];
    update?: Prisma.RoomUpdateWithWhereUniqueWithoutHostInput | Prisma.RoomUpdateWithWhereUniqueWithoutHostInput[];
    updateMany?: Prisma.RoomUpdateManyWithWhereWithoutHostInput | Prisma.RoomUpdateManyWithWhereWithoutHostInput[];
    deleteMany?: Prisma.RoomScalarWhereInput | Prisma.RoomScalarWhereInput[];
};
export type EnumRoomStatusFieldUpdateOperationsInput = {
    set?: $Enums.RoomStatus;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type RoomCreateNestedOneWithoutPlayersInput = {
    create?: Prisma.XOR<Prisma.RoomCreateWithoutPlayersInput, Prisma.RoomUncheckedCreateWithoutPlayersInput>;
    connectOrCreate?: Prisma.RoomCreateOrConnectWithoutPlayersInput;
    connect?: Prisma.RoomWhereUniqueInput;
};
export type RoomUpdateOneRequiredWithoutPlayersNestedInput = {
    create?: Prisma.XOR<Prisma.RoomCreateWithoutPlayersInput, Prisma.RoomUncheckedCreateWithoutPlayersInput>;
    connectOrCreate?: Prisma.RoomCreateOrConnectWithoutPlayersInput;
    upsert?: Prisma.RoomUpsertWithoutPlayersInput;
    connect?: Prisma.RoomWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.RoomUpdateToOneWithWhereWithoutPlayersInput, Prisma.RoomUpdateWithoutPlayersInput>, Prisma.RoomUncheckedUpdateWithoutPlayersInput>;
};
export type RoomCreateNestedOneWithoutGamesInput = {
    create?: Prisma.XOR<Prisma.RoomCreateWithoutGamesInput, Prisma.RoomUncheckedCreateWithoutGamesInput>;
    connectOrCreate?: Prisma.RoomCreateOrConnectWithoutGamesInput;
    connect?: Prisma.RoomWhereUniqueInput;
};
export type RoomUpdateOneRequiredWithoutGamesNestedInput = {
    create?: Prisma.XOR<Prisma.RoomCreateWithoutGamesInput, Prisma.RoomUncheckedCreateWithoutGamesInput>;
    connectOrCreate?: Prisma.RoomCreateOrConnectWithoutGamesInput;
    upsert?: Prisma.RoomUpsertWithoutGamesInput;
    connect?: Prisma.RoomWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.RoomUpdateToOneWithWhereWithoutGamesInput, Prisma.RoomUpdateWithoutGamesInput>, Prisma.RoomUncheckedUpdateWithoutGamesInput>;
};
export type RoomCreateWithoutHostInput = {
    id?: string;
    code: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    players?: Prisma.RoomPlayerCreateNestedManyWithoutRoomInput;
    games?: Prisma.GameRecordCreateNestedManyWithoutRoomInput;
};
export type RoomUncheckedCreateWithoutHostInput = {
    id?: string;
    code: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    players?: Prisma.RoomPlayerUncheckedCreateNestedManyWithoutRoomInput;
    games?: Prisma.GameRecordUncheckedCreateNestedManyWithoutRoomInput;
};
export type RoomCreateOrConnectWithoutHostInput = {
    where: Prisma.RoomWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoomCreateWithoutHostInput, Prisma.RoomUncheckedCreateWithoutHostInput>;
};
export type RoomCreateManyHostInputEnvelope = {
    data: Prisma.RoomCreateManyHostInput | Prisma.RoomCreateManyHostInput[];
    skipDuplicates?: boolean;
};
export type RoomUpsertWithWhereUniqueWithoutHostInput = {
    where: Prisma.RoomWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoomUpdateWithoutHostInput, Prisma.RoomUncheckedUpdateWithoutHostInput>;
    create: Prisma.XOR<Prisma.RoomCreateWithoutHostInput, Prisma.RoomUncheckedCreateWithoutHostInput>;
};
export type RoomUpdateWithWhereUniqueWithoutHostInput = {
    where: Prisma.RoomWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoomUpdateWithoutHostInput, Prisma.RoomUncheckedUpdateWithoutHostInput>;
};
export type RoomUpdateManyWithWhereWithoutHostInput = {
    where: Prisma.RoomScalarWhereInput;
    data: Prisma.XOR<Prisma.RoomUpdateManyMutationInput, Prisma.RoomUncheckedUpdateManyWithoutHostInput>;
};
export type RoomScalarWhereInput = {
    AND?: Prisma.RoomScalarWhereInput | Prisma.RoomScalarWhereInput[];
    OR?: Prisma.RoomScalarWhereInput[];
    NOT?: Prisma.RoomScalarWhereInput | Prisma.RoomScalarWhereInput[];
    id?: Prisma.StringFilter<"Room"> | string;
    code?: Prisma.StringFilter<"Room"> | string;
    hostId?: Prisma.StringFilter<"Room"> | string;
    status?: Prisma.EnumRoomStatusFilter<"Room"> | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonFilter<"Room">;
    maxPlayers?: Prisma.IntFilter<"Room"> | number;
    createdAt?: Prisma.DateTimeFilter<"Room"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Room"> | Date | string;
};
export type RoomCreateWithoutPlayersInput = {
    id?: string;
    code: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    host: Prisma.UserCreateNestedOneWithoutHostedRoomsInput;
    games?: Prisma.GameRecordCreateNestedManyWithoutRoomInput;
};
export type RoomUncheckedCreateWithoutPlayersInput = {
    id?: string;
    code: string;
    hostId: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    games?: Prisma.GameRecordUncheckedCreateNestedManyWithoutRoomInput;
};
export type RoomCreateOrConnectWithoutPlayersInput = {
    where: Prisma.RoomWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoomCreateWithoutPlayersInput, Prisma.RoomUncheckedCreateWithoutPlayersInput>;
};
export type RoomUpsertWithoutPlayersInput = {
    update: Prisma.XOR<Prisma.RoomUpdateWithoutPlayersInput, Prisma.RoomUncheckedUpdateWithoutPlayersInput>;
    create: Prisma.XOR<Prisma.RoomCreateWithoutPlayersInput, Prisma.RoomUncheckedCreateWithoutPlayersInput>;
    where?: Prisma.RoomWhereInput;
};
export type RoomUpdateToOneWithWhereWithoutPlayersInput = {
    where?: Prisma.RoomWhereInput;
    data: Prisma.XOR<Prisma.RoomUpdateWithoutPlayersInput, Prisma.RoomUncheckedUpdateWithoutPlayersInput>;
};
export type RoomUpdateWithoutPlayersInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    host?: Prisma.UserUpdateOneRequiredWithoutHostedRoomsNestedInput;
    games?: Prisma.GameRecordUpdateManyWithoutRoomNestedInput;
};
export type RoomUncheckedUpdateWithoutPlayersInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    hostId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    games?: Prisma.GameRecordUncheckedUpdateManyWithoutRoomNestedInput;
};
export type RoomCreateWithoutGamesInput = {
    id?: string;
    code: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    host: Prisma.UserCreateNestedOneWithoutHostedRoomsInput;
    players?: Prisma.RoomPlayerCreateNestedManyWithoutRoomInput;
};
export type RoomUncheckedCreateWithoutGamesInput = {
    id?: string;
    code: string;
    hostId: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    players?: Prisma.RoomPlayerUncheckedCreateNestedManyWithoutRoomInput;
};
export type RoomCreateOrConnectWithoutGamesInput = {
    where: Prisma.RoomWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoomCreateWithoutGamesInput, Prisma.RoomUncheckedCreateWithoutGamesInput>;
};
export type RoomUpsertWithoutGamesInput = {
    update: Prisma.XOR<Prisma.RoomUpdateWithoutGamesInput, Prisma.RoomUncheckedUpdateWithoutGamesInput>;
    create: Prisma.XOR<Prisma.RoomCreateWithoutGamesInput, Prisma.RoomUncheckedCreateWithoutGamesInput>;
    where?: Prisma.RoomWhereInput;
};
export type RoomUpdateToOneWithWhereWithoutGamesInput = {
    where?: Prisma.RoomWhereInput;
    data: Prisma.XOR<Prisma.RoomUpdateWithoutGamesInput, Prisma.RoomUncheckedUpdateWithoutGamesInput>;
};
export type RoomUpdateWithoutGamesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    host?: Prisma.UserUpdateOneRequiredWithoutHostedRoomsNestedInput;
    players?: Prisma.RoomPlayerUpdateManyWithoutRoomNestedInput;
};
export type RoomUncheckedUpdateWithoutGamesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    hostId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    players?: Prisma.RoomPlayerUncheckedUpdateManyWithoutRoomNestedInput;
};
export type RoomCreateManyHostInput = {
    id?: string;
    code: string;
    status?: $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RoomUpdateWithoutHostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    players?: Prisma.RoomPlayerUpdateManyWithoutRoomNestedInput;
    games?: Prisma.GameRecordUpdateManyWithoutRoomNestedInput;
};
export type RoomUncheckedUpdateWithoutHostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    players?: Prisma.RoomPlayerUncheckedUpdateManyWithoutRoomNestedInput;
    games?: Prisma.GameRecordUncheckedUpdateManyWithoutRoomNestedInput;
};
export type RoomUncheckedUpdateManyWithoutHostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    code?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus;
    roleConfig?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    maxPlayers?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomCountOutputType = {
    players: number;
    games: number;
};
export type RoomCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    players?: boolean | RoomCountOutputTypeCountPlayersArgs;
    games?: boolean | RoomCountOutputTypeCountGamesArgs;
};
export type RoomCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomCountOutputTypeSelect<ExtArgs> | null;
};
export type RoomCountOutputTypeCountPlayersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoomPlayerWhereInput;
};
export type RoomCountOutputTypeCountGamesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.GameRecordWhereInput;
};
export type RoomSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    code?: boolean;
    hostId?: boolean;
    status?: boolean;
    roleConfig?: boolean;
    maxPlayers?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    host?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    players?: boolean | Prisma.Room$playersArgs<ExtArgs>;
    games?: boolean | Prisma.Room$gamesArgs<ExtArgs>;
    _count?: boolean | Prisma.RoomCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["room"]>;
export type RoomSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    code?: boolean;
    hostId?: boolean;
    status?: boolean;
    roleConfig?: boolean;
    maxPlayers?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    host?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["room"]>;
export type RoomSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    code?: boolean;
    hostId?: boolean;
    status?: boolean;
    roleConfig?: boolean;
    maxPlayers?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    host?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["room"]>;
export type RoomSelectScalar = {
    id?: boolean;
    code?: boolean;
    hostId?: boolean;
    status?: boolean;
    roleConfig?: boolean;
    maxPlayers?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type RoomOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "code" | "hostId" | "status" | "roleConfig" | "maxPlayers" | "createdAt" | "updatedAt", ExtArgs["result"]["room"]>;
export type RoomInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    host?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    players?: boolean | Prisma.Room$playersArgs<ExtArgs>;
    games?: boolean | Prisma.Room$gamesArgs<ExtArgs>;
    _count?: boolean | Prisma.RoomCountOutputTypeDefaultArgs<ExtArgs>;
};
export type RoomIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    host?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type RoomIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    host?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $RoomPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Room";
    objects: {
        host: Prisma.$UserPayload<ExtArgs>;
        players: Prisma.$RoomPlayerPayload<ExtArgs>[];
        games: Prisma.$GameRecordPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        code: string;
        hostId: string;
        status: $Enums.RoomStatus;
        roleConfig: runtime.JsonValue;
        maxPlayers: number;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["room"]>;
    composites: {};
};
export type RoomGetPayload<S extends boolean | null | undefined | RoomDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RoomPayload, S>;
export type RoomCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RoomFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RoomCountAggregateInputType | true;
};
export interface RoomDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Room'];
        meta: {
            name: 'Room';
        };
    };
    findUnique<T extends RoomFindUniqueArgs>(args: Prisma.SelectSubset<T, RoomFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RoomFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RoomFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RoomFindFirstArgs>(args?: Prisma.SelectSubset<T, RoomFindFirstArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RoomFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RoomFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RoomFindManyArgs>(args?: Prisma.SelectSubset<T, RoomFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RoomCreateArgs>(args: Prisma.SelectSubset<T, RoomCreateArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RoomCreateManyArgs>(args?: Prisma.SelectSubset<T, RoomCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RoomCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RoomCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RoomDeleteArgs>(args: Prisma.SelectSubset<T, RoomDeleteArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RoomUpdateArgs>(args: Prisma.SelectSubset<T, RoomUpdateArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RoomDeleteManyArgs>(args?: Prisma.SelectSubset<T, RoomDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RoomUpdateManyArgs>(args: Prisma.SelectSubset<T, RoomUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RoomUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RoomUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RoomUpsertArgs>(args: Prisma.SelectSubset<T, RoomUpsertArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RoomCountArgs>(args?: Prisma.Subset<T, RoomCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RoomCountAggregateOutputType> : number>;
    aggregate<T extends RoomAggregateArgs>(args: Prisma.Subset<T, RoomAggregateArgs>): Prisma.PrismaPromise<GetRoomAggregateType<T>>;
    groupBy<T extends RoomGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RoomGroupByArgs['orderBy'];
    } : {
        orderBy?: RoomGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RoomGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoomGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RoomFieldRefs;
}
export interface Prisma__RoomClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    host<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    players<T extends Prisma.Room$playersArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Room$playersArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    games<T extends Prisma.Room$gamesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Room$gamesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RoomFieldRefs {
    readonly id: Prisma.FieldRef<"Room", 'String'>;
    readonly code: Prisma.FieldRef<"Room", 'String'>;
    readonly hostId: Prisma.FieldRef<"Room", 'String'>;
    readonly status: Prisma.FieldRef<"Room", 'RoomStatus'>;
    readonly roleConfig: Prisma.FieldRef<"Room", 'Json'>;
    readonly maxPlayers: Prisma.FieldRef<"Room", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"Room", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Room", 'DateTime'>;
}
export type RoomFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    where: Prisma.RoomWhereUniqueInput;
};
export type RoomFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    where: Prisma.RoomWhereUniqueInput;
};
export type RoomFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    where?: Prisma.RoomWhereInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput | Prisma.RoomOrderByWithRelationInput[];
    cursor?: Prisma.RoomWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoomScalarFieldEnum | Prisma.RoomScalarFieldEnum[];
};
export type RoomFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    where?: Prisma.RoomWhereInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput | Prisma.RoomOrderByWithRelationInput[];
    cursor?: Prisma.RoomWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoomScalarFieldEnum | Prisma.RoomScalarFieldEnum[];
};
export type RoomFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    where?: Prisma.RoomWhereInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput | Prisma.RoomOrderByWithRelationInput[];
    cursor?: Prisma.RoomWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoomScalarFieldEnum | Prisma.RoomScalarFieldEnum[];
};
export type RoomCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoomCreateInput, Prisma.RoomUncheckedCreateInput>;
};
export type RoomCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RoomCreateManyInput | Prisma.RoomCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RoomCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    data: Prisma.RoomCreateManyInput | Prisma.RoomCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.RoomIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type RoomUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoomUpdateInput, Prisma.RoomUncheckedUpdateInput>;
    where: Prisma.RoomWhereUniqueInput;
};
export type RoomUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RoomUpdateManyMutationInput, Prisma.RoomUncheckedUpdateManyInput>;
    where?: Prisma.RoomWhereInput;
    limit?: number;
};
export type RoomUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoomUpdateManyMutationInput, Prisma.RoomUncheckedUpdateManyInput>;
    where?: Prisma.RoomWhereInput;
    limit?: number;
    include?: Prisma.RoomIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type RoomUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    where: Prisma.RoomWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoomCreateInput, Prisma.RoomUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RoomUpdateInput, Prisma.RoomUncheckedUpdateInput>;
};
export type RoomDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
    where: Prisma.RoomWhereUniqueInput;
};
export type RoomDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoomWhereInput;
    limit?: number;
};
export type Room$playersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelect<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    include?: Prisma.RoomPlayerInclude<ExtArgs> | null;
    where?: Prisma.RoomPlayerWhereInput;
    orderBy?: Prisma.RoomPlayerOrderByWithRelationInput | Prisma.RoomPlayerOrderByWithRelationInput[];
    cursor?: Prisma.RoomPlayerWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoomPlayerScalarFieldEnum | Prisma.RoomPlayerScalarFieldEnum[];
};
export type Room$gamesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelect<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    include?: Prisma.GameRecordInclude<ExtArgs> | null;
    where?: Prisma.GameRecordWhereInput;
    orderBy?: Prisma.GameRecordOrderByWithRelationInput | Prisma.GameRecordOrderByWithRelationInput[];
    cursor?: Prisma.GameRecordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.GameRecordScalarFieldEnum | Prisma.GameRecordScalarFieldEnum[];
};
export type RoomDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomSelect<ExtArgs> | null;
    omit?: Prisma.RoomOmit<ExtArgs> | null;
    include?: Prisma.RoomInclude<ExtArgs> | null;
};
