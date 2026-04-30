import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type RoomPlayerModel = runtime.Types.Result.DefaultSelection<Prisma.$RoomPlayerPayload>;
export type AggregateRoomPlayer = {
    _count: RoomPlayerCountAggregateOutputType | null;
    _avg: RoomPlayerAvgAggregateOutputType | null;
    _sum: RoomPlayerSumAggregateOutputType | null;
    _min: RoomPlayerMinAggregateOutputType | null;
    _max: RoomPlayerMaxAggregateOutputType | null;
};
export type RoomPlayerAvgAggregateOutputType = {
    seatNo: number | null;
};
export type RoomPlayerSumAggregateOutputType = {
    seatNo: number | null;
};
export type RoomPlayerMinAggregateOutputType = {
    id: string | null;
    roomId: string | null;
    userId: string | null;
    seatNo: number | null;
    role: string | null;
    joinedAt: Date | null;
};
export type RoomPlayerMaxAggregateOutputType = {
    id: string | null;
    roomId: string | null;
    userId: string | null;
    seatNo: number | null;
    role: string | null;
    joinedAt: Date | null;
};
export type RoomPlayerCountAggregateOutputType = {
    id: number;
    roomId: number;
    userId: number;
    seatNo: number;
    role: number;
    joinedAt: number;
    _all: number;
};
export type RoomPlayerAvgAggregateInputType = {
    seatNo?: true;
};
export type RoomPlayerSumAggregateInputType = {
    seatNo?: true;
};
export type RoomPlayerMinAggregateInputType = {
    id?: true;
    roomId?: true;
    userId?: true;
    seatNo?: true;
    role?: true;
    joinedAt?: true;
};
export type RoomPlayerMaxAggregateInputType = {
    id?: true;
    roomId?: true;
    userId?: true;
    seatNo?: true;
    role?: true;
    joinedAt?: true;
};
export type RoomPlayerCountAggregateInputType = {
    id?: true;
    roomId?: true;
    userId?: true;
    seatNo?: true;
    role?: true;
    joinedAt?: true;
    _all?: true;
};
export type RoomPlayerAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoomPlayerWhereInput;
    orderBy?: Prisma.RoomPlayerOrderByWithRelationInput | Prisma.RoomPlayerOrderByWithRelationInput[];
    cursor?: Prisma.RoomPlayerWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RoomPlayerCountAggregateInputType;
    _avg?: RoomPlayerAvgAggregateInputType;
    _sum?: RoomPlayerSumAggregateInputType;
    _min?: RoomPlayerMinAggregateInputType;
    _max?: RoomPlayerMaxAggregateInputType;
};
export type GetRoomPlayerAggregateType<T extends RoomPlayerAggregateArgs> = {
    [P in keyof T & keyof AggregateRoomPlayer]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRoomPlayer[P]> : Prisma.GetScalarType<T[P], AggregateRoomPlayer[P]>;
};
export type RoomPlayerGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoomPlayerWhereInput;
    orderBy?: Prisma.RoomPlayerOrderByWithAggregationInput | Prisma.RoomPlayerOrderByWithAggregationInput[];
    by: Prisma.RoomPlayerScalarFieldEnum[] | Prisma.RoomPlayerScalarFieldEnum;
    having?: Prisma.RoomPlayerScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RoomPlayerCountAggregateInputType | true;
    _avg?: RoomPlayerAvgAggregateInputType;
    _sum?: RoomPlayerSumAggregateInputType;
    _min?: RoomPlayerMinAggregateInputType;
    _max?: RoomPlayerMaxAggregateInputType;
};
export type RoomPlayerGroupByOutputType = {
    id: string;
    roomId: string;
    userId: string;
    seatNo: number;
    role: string | null;
    joinedAt: Date;
    _count: RoomPlayerCountAggregateOutputType | null;
    _avg: RoomPlayerAvgAggregateOutputType | null;
    _sum: RoomPlayerSumAggregateOutputType | null;
    _min: RoomPlayerMinAggregateOutputType | null;
    _max: RoomPlayerMaxAggregateOutputType | null;
};
export type GetRoomPlayerGroupByPayload<T extends RoomPlayerGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RoomPlayerGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RoomPlayerGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RoomPlayerGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RoomPlayerGroupByOutputType[P]>;
}>>;
export type RoomPlayerWhereInput = {
    AND?: Prisma.RoomPlayerWhereInput | Prisma.RoomPlayerWhereInput[];
    OR?: Prisma.RoomPlayerWhereInput[];
    NOT?: Prisma.RoomPlayerWhereInput | Prisma.RoomPlayerWhereInput[];
    id?: Prisma.StringFilter<"RoomPlayer"> | string;
    roomId?: Prisma.StringFilter<"RoomPlayer"> | string;
    userId?: Prisma.StringFilter<"RoomPlayer"> | string;
    seatNo?: Prisma.IntFilter<"RoomPlayer"> | number;
    role?: Prisma.StringNullableFilter<"RoomPlayer"> | string | null;
    joinedAt?: Prisma.DateTimeFilter<"RoomPlayer"> | Date | string;
    room?: Prisma.XOR<Prisma.RoomScalarRelationFilter, Prisma.RoomWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type RoomPlayerOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    seatNo?: Prisma.SortOrder;
    role?: Prisma.SortOrderInput | Prisma.SortOrder;
    joinedAt?: Prisma.SortOrder;
    room?: Prisma.RoomOrderByWithRelationInput;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type RoomPlayerWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    roomId_userId?: Prisma.RoomPlayerRoomIdUserIdCompoundUniqueInput;
    roomId_seatNo?: Prisma.RoomPlayerRoomIdSeatNoCompoundUniqueInput;
    AND?: Prisma.RoomPlayerWhereInput | Prisma.RoomPlayerWhereInput[];
    OR?: Prisma.RoomPlayerWhereInput[];
    NOT?: Prisma.RoomPlayerWhereInput | Prisma.RoomPlayerWhereInput[];
    roomId?: Prisma.StringFilter<"RoomPlayer"> | string;
    userId?: Prisma.StringFilter<"RoomPlayer"> | string;
    seatNo?: Prisma.IntFilter<"RoomPlayer"> | number;
    role?: Prisma.StringNullableFilter<"RoomPlayer"> | string | null;
    joinedAt?: Prisma.DateTimeFilter<"RoomPlayer"> | Date | string;
    room?: Prisma.XOR<Prisma.RoomScalarRelationFilter, Prisma.RoomWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "roomId_userId" | "roomId_seatNo">;
export type RoomPlayerOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    seatNo?: Prisma.SortOrder;
    role?: Prisma.SortOrderInput | Prisma.SortOrder;
    joinedAt?: Prisma.SortOrder;
    _count?: Prisma.RoomPlayerCountOrderByAggregateInput;
    _avg?: Prisma.RoomPlayerAvgOrderByAggregateInput;
    _max?: Prisma.RoomPlayerMaxOrderByAggregateInput;
    _min?: Prisma.RoomPlayerMinOrderByAggregateInput;
    _sum?: Prisma.RoomPlayerSumOrderByAggregateInput;
};
export type RoomPlayerScalarWhereWithAggregatesInput = {
    AND?: Prisma.RoomPlayerScalarWhereWithAggregatesInput | Prisma.RoomPlayerScalarWhereWithAggregatesInput[];
    OR?: Prisma.RoomPlayerScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RoomPlayerScalarWhereWithAggregatesInput | Prisma.RoomPlayerScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"RoomPlayer"> | string;
    roomId?: Prisma.StringWithAggregatesFilter<"RoomPlayer"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"RoomPlayer"> | string;
    seatNo?: Prisma.IntWithAggregatesFilter<"RoomPlayer"> | number;
    role?: Prisma.StringNullableWithAggregatesFilter<"RoomPlayer"> | string | null;
    joinedAt?: Prisma.DateTimeWithAggregatesFilter<"RoomPlayer"> | Date | string;
};
export type RoomPlayerCreateInput = {
    id?: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
    room: Prisma.RoomCreateNestedOneWithoutPlayersInput;
    user: Prisma.UserCreateNestedOneWithoutRoomPlayersInput;
};
export type RoomPlayerUncheckedCreateInput = {
    id?: string;
    roomId: string;
    userId: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
};
export type RoomPlayerUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    room?: Prisma.RoomUpdateOneRequiredWithoutPlayersNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutRoomPlayersNestedInput;
};
export type RoomPlayerUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roomId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomPlayerCreateManyInput = {
    id?: string;
    roomId: string;
    userId: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
};
export type RoomPlayerUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomPlayerUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roomId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomPlayerListRelationFilter = {
    every?: Prisma.RoomPlayerWhereInput;
    some?: Prisma.RoomPlayerWhereInput;
    none?: Prisma.RoomPlayerWhereInput;
};
export type RoomPlayerOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type RoomPlayerRoomIdUserIdCompoundUniqueInput = {
    roomId: string;
    userId: string;
};
export type RoomPlayerRoomIdSeatNoCompoundUniqueInput = {
    roomId: string;
    seatNo: number;
};
export type RoomPlayerCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    seatNo?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    joinedAt?: Prisma.SortOrder;
};
export type RoomPlayerAvgOrderByAggregateInput = {
    seatNo?: Prisma.SortOrder;
};
export type RoomPlayerMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    seatNo?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    joinedAt?: Prisma.SortOrder;
};
export type RoomPlayerMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    seatNo?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    joinedAt?: Prisma.SortOrder;
};
export type RoomPlayerSumOrderByAggregateInput = {
    seatNo?: Prisma.SortOrder;
};
export type RoomPlayerCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.RoomPlayerCreateWithoutUserInput, Prisma.RoomPlayerUncheckedCreateWithoutUserInput> | Prisma.RoomPlayerCreateWithoutUserInput[] | Prisma.RoomPlayerUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.RoomPlayerCreateOrConnectWithoutUserInput | Prisma.RoomPlayerCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.RoomPlayerCreateManyUserInputEnvelope;
    connect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
};
export type RoomPlayerUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.RoomPlayerCreateWithoutUserInput, Prisma.RoomPlayerUncheckedCreateWithoutUserInput> | Prisma.RoomPlayerCreateWithoutUserInput[] | Prisma.RoomPlayerUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.RoomPlayerCreateOrConnectWithoutUserInput | Prisma.RoomPlayerCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.RoomPlayerCreateManyUserInputEnvelope;
    connect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
};
export type RoomPlayerUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.RoomPlayerCreateWithoutUserInput, Prisma.RoomPlayerUncheckedCreateWithoutUserInput> | Prisma.RoomPlayerCreateWithoutUserInput[] | Prisma.RoomPlayerUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.RoomPlayerCreateOrConnectWithoutUserInput | Prisma.RoomPlayerCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.RoomPlayerUpsertWithWhereUniqueWithoutUserInput | Prisma.RoomPlayerUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.RoomPlayerCreateManyUserInputEnvelope;
    set?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    disconnect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    delete?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    connect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    update?: Prisma.RoomPlayerUpdateWithWhereUniqueWithoutUserInput | Prisma.RoomPlayerUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.RoomPlayerUpdateManyWithWhereWithoutUserInput | Prisma.RoomPlayerUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.RoomPlayerScalarWhereInput | Prisma.RoomPlayerScalarWhereInput[];
};
export type RoomPlayerUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.RoomPlayerCreateWithoutUserInput, Prisma.RoomPlayerUncheckedCreateWithoutUserInput> | Prisma.RoomPlayerCreateWithoutUserInput[] | Prisma.RoomPlayerUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.RoomPlayerCreateOrConnectWithoutUserInput | Prisma.RoomPlayerCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.RoomPlayerUpsertWithWhereUniqueWithoutUserInput | Prisma.RoomPlayerUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.RoomPlayerCreateManyUserInputEnvelope;
    set?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    disconnect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    delete?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    connect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    update?: Prisma.RoomPlayerUpdateWithWhereUniqueWithoutUserInput | Prisma.RoomPlayerUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.RoomPlayerUpdateManyWithWhereWithoutUserInput | Prisma.RoomPlayerUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.RoomPlayerScalarWhereInput | Prisma.RoomPlayerScalarWhereInput[];
};
export type RoomPlayerCreateNestedManyWithoutRoomInput = {
    create?: Prisma.XOR<Prisma.RoomPlayerCreateWithoutRoomInput, Prisma.RoomPlayerUncheckedCreateWithoutRoomInput> | Prisma.RoomPlayerCreateWithoutRoomInput[] | Prisma.RoomPlayerUncheckedCreateWithoutRoomInput[];
    connectOrCreate?: Prisma.RoomPlayerCreateOrConnectWithoutRoomInput | Prisma.RoomPlayerCreateOrConnectWithoutRoomInput[];
    createMany?: Prisma.RoomPlayerCreateManyRoomInputEnvelope;
    connect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
};
export type RoomPlayerUncheckedCreateNestedManyWithoutRoomInput = {
    create?: Prisma.XOR<Prisma.RoomPlayerCreateWithoutRoomInput, Prisma.RoomPlayerUncheckedCreateWithoutRoomInput> | Prisma.RoomPlayerCreateWithoutRoomInput[] | Prisma.RoomPlayerUncheckedCreateWithoutRoomInput[];
    connectOrCreate?: Prisma.RoomPlayerCreateOrConnectWithoutRoomInput | Prisma.RoomPlayerCreateOrConnectWithoutRoomInput[];
    createMany?: Prisma.RoomPlayerCreateManyRoomInputEnvelope;
    connect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
};
export type RoomPlayerUpdateManyWithoutRoomNestedInput = {
    create?: Prisma.XOR<Prisma.RoomPlayerCreateWithoutRoomInput, Prisma.RoomPlayerUncheckedCreateWithoutRoomInput> | Prisma.RoomPlayerCreateWithoutRoomInput[] | Prisma.RoomPlayerUncheckedCreateWithoutRoomInput[];
    connectOrCreate?: Prisma.RoomPlayerCreateOrConnectWithoutRoomInput | Prisma.RoomPlayerCreateOrConnectWithoutRoomInput[];
    upsert?: Prisma.RoomPlayerUpsertWithWhereUniqueWithoutRoomInput | Prisma.RoomPlayerUpsertWithWhereUniqueWithoutRoomInput[];
    createMany?: Prisma.RoomPlayerCreateManyRoomInputEnvelope;
    set?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    disconnect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    delete?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    connect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    update?: Prisma.RoomPlayerUpdateWithWhereUniqueWithoutRoomInput | Prisma.RoomPlayerUpdateWithWhereUniqueWithoutRoomInput[];
    updateMany?: Prisma.RoomPlayerUpdateManyWithWhereWithoutRoomInput | Prisma.RoomPlayerUpdateManyWithWhereWithoutRoomInput[];
    deleteMany?: Prisma.RoomPlayerScalarWhereInput | Prisma.RoomPlayerScalarWhereInput[];
};
export type RoomPlayerUncheckedUpdateManyWithoutRoomNestedInput = {
    create?: Prisma.XOR<Prisma.RoomPlayerCreateWithoutRoomInput, Prisma.RoomPlayerUncheckedCreateWithoutRoomInput> | Prisma.RoomPlayerCreateWithoutRoomInput[] | Prisma.RoomPlayerUncheckedCreateWithoutRoomInput[];
    connectOrCreate?: Prisma.RoomPlayerCreateOrConnectWithoutRoomInput | Prisma.RoomPlayerCreateOrConnectWithoutRoomInput[];
    upsert?: Prisma.RoomPlayerUpsertWithWhereUniqueWithoutRoomInput | Prisma.RoomPlayerUpsertWithWhereUniqueWithoutRoomInput[];
    createMany?: Prisma.RoomPlayerCreateManyRoomInputEnvelope;
    set?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    disconnect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    delete?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    connect?: Prisma.RoomPlayerWhereUniqueInput | Prisma.RoomPlayerWhereUniqueInput[];
    update?: Prisma.RoomPlayerUpdateWithWhereUniqueWithoutRoomInput | Prisma.RoomPlayerUpdateWithWhereUniqueWithoutRoomInput[];
    updateMany?: Prisma.RoomPlayerUpdateManyWithWhereWithoutRoomInput | Prisma.RoomPlayerUpdateManyWithWhereWithoutRoomInput[];
    deleteMany?: Prisma.RoomPlayerScalarWhereInput | Prisma.RoomPlayerScalarWhereInput[];
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type RoomPlayerCreateWithoutUserInput = {
    id?: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
    room: Prisma.RoomCreateNestedOneWithoutPlayersInput;
};
export type RoomPlayerUncheckedCreateWithoutUserInput = {
    id?: string;
    roomId: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
};
export type RoomPlayerCreateOrConnectWithoutUserInput = {
    where: Prisma.RoomPlayerWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoomPlayerCreateWithoutUserInput, Prisma.RoomPlayerUncheckedCreateWithoutUserInput>;
};
export type RoomPlayerCreateManyUserInputEnvelope = {
    data: Prisma.RoomPlayerCreateManyUserInput | Prisma.RoomPlayerCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type RoomPlayerUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.RoomPlayerWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoomPlayerUpdateWithoutUserInput, Prisma.RoomPlayerUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.RoomPlayerCreateWithoutUserInput, Prisma.RoomPlayerUncheckedCreateWithoutUserInput>;
};
export type RoomPlayerUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.RoomPlayerWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoomPlayerUpdateWithoutUserInput, Prisma.RoomPlayerUncheckedUpdateWithoutUserInput>;
};
export type RoomPlayerUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.RoomPlayerScalarWhereInput;
    data: Prisma.XOR<Prisma.RoomPlayerUpdateManyMutationInput, Prisma.RoomPlayerUncheckedUpdateManyWithoutUserInput>;
};
export type RoomPlayerScalarWhereInput = {
    AND?: Prisma.RoomPlayerScalarWhereInput | Prisma.RoomPlayerScalarWhereInput[];
    OR?: Prisma.RoomPlayerScalarWhereInput[];
    NOT?: Prisma.RoomPlayerScalarWhereInput | Prisma.RoomPlayerScalarWhereInput[];
    id?: Prisma.StringFilter<"RoomPlayer"> | string;
    roomId?: Prisma.StringFilter<"RoomPlayer"> | string;
    userId?: Prisma.StringFilter<"RoomPlayer"> | string;
    seatNo?: Prisma.IntFilter<"RoomPlayer"> | number;
    role?: Prisma.StringNullableFilter<"RoomPlayer"> | string | null;
    joinedAt?: Prisma.DateTimeFilter<"RoomPlayer"> | Date | string;
};
export type RoomPlayerCreateWithoutRoomInput = {
    id?: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutRoomPlayersInput;
};
export type RoomPlayerUncheckedCreateWithoutRoomInput = {
    id?: string;
    userId: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
};
export type RoomPlayerCreateOrConnectWithoutRoomInput = {
    where: Prisma.RoomPlayerWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoomPlayerCreateWithoutRoomInput, Prisma.RoomPlayerUncheckedCreateWithoutRoomInput>;
};
export type RoomPlayerCreateManyRoomInputEnvelope = {
    data: Prisma.RoomPlayerCreateManyRoomInput | Prisma.RoomPlayerCreateManyRoomInput[];
    skipDuplicates?: boolean;
};
export type RoomPlayerUpsertWithWhereUniqueWithoutRoomInput = {
    where: Prisma.RoomPlayerWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoomPlayerUpdateWithoutRoomInput, Prisma.RoomPlayerUncheckedUpdateWithoutRoomInput>;
    create: Prisma.XOR<Prisma.RoomPlayerCreateWithoutRoomInput, Prisma.RoomPlayerUncheckedCreateWithoutRoomInput>;
};
export type RoomPlayerUpdateWithWhereUniqueWithoutRoomInput = {
    where: Prisma.RoomPlayerWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoomPlayerUpdateWithoutRoomInput, Prisma.RoomPlayerUncheckedUpdateWithoutRoomInput>;
};
export type RoomPlayerUpdateManyWithWhereWithoutRoomInput = {
    where: Prisma.RoomPlayerScalarWhereInput;
    data: Prisma.XOR<Prisma.RoomPlayerUpdateManyMutationInput, Prisma.RoomPlayerUncheckedUpdateManyWithoutRoomInput>;
};
export type RoomPlayerCreateManyUserInput = {
    id?: string;
    roomId: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
};
export type RoomPlayerUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    room?: Prisma.RoomUpdateOneRequiredWithoutPlayersNestedInput;
};
export type RoomPlayerUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roomId?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomPlayerUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roomId?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomPlayerCreateManyRoomInput = {
    id?: string;
    userId: string;
    seatNo: number;
    role?: string | null;
    joinedAt?: Date | string;
};
export type RoomPlayerUpdateWithoutRoomInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutRoomPlayersNestedInput;
};
export type RoomPlayerUncheckedUpdateWithoutRoomInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomPlayerUncheckedUpdateManyWithoutRoomInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNo?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    joinedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoomPlayerSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roomId?: boolean;
    userId?: boolean;
    seatNo?: boolean;
    role?: boolean;
    joinedAt?: boolean;
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roomPlayer"]>;
export type RoomPlayerSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roomId?: boolean;
    userId?: boolean;
    seatNo?: boolean;
    role?: boolean;
    joinedAt?: boolean;
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roomPlayer"]>;
export type RoomPlayerSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roomId?: boolean;
    userId?: boolean;
    seatNo?: boolean;
    role?: boolean;
    joinedAt?: boolean;
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roomPlayer"]>;
export type RoomPlayerSelectScalar = {
    id?: boolean;
    roomId?: boolean;
    userId?: boolean;
    seatNo?: boolean;
    role?: boolean;
    joinedAt?: boolean;
};
export type RoomPlayerOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "roomId" | "userId" | "seatNo" | "role" | "joinedAt", ExtArgs["result"]["roomPlayer"]>;
export type RoomPlayerInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type RoomPlayerIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type RoomPlayerIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $RoomPlayerPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "RoomPlayer";
    objects: {
        room: Prisma.$RoomPayload<ExtArgs>;
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        roomId: string;
        userId: string;
        seatNo: number;
        role: string | null;
        joinedAt: Date;
    }, ExtArgs["result"]["roomPlayer"]>;
    composites: {};
};
export type RoomPlayerGetPayload<S extends boolean | null | undefined | RoomPlayerDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload, S>;
export type RoomPlayerCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RoomPlayerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RoomPlayerCountAggregateInputType | true;
};
export interface RoomPlayerDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['RoomPlayer'];
        meta: {
            name: 'RoomPlayer';
        };
    };
    findUnique<T extends RoomPlayerFindUniqueArgs>(args: Prisma.SelectSubset<T, RoomPlayerFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RoomPlayerClient<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RoomPlayerFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RoomPlayerFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoomPlayerClient<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RoomPlayerFindFirstArgs>(args?: Prisma.SelectSubset<T, RoomPlayerFindFirstArgs<ExtArgs>>): Prisma.Prisma__RoomPlayerClient<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RoomPlayerFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RoomPlayerFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoomPlayerClient<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RoomPlayerFindManyArgs>(args?: Prisma.SelectSubset<T, RoomPlayerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RoomPlayerCreateArgs>(args: Prisma.SelectSubset<T, RoomPlayerCreateArgs<ExtArgs>>): Prisma.Prisma__RoomPlayerClient<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RoomPlayerCreateManyArgs>(args?: Prisma.SelectSubset<T, RoomPlayerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RoomPlayerCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RoomPlayerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RoomPlayerDeleteArgs>(args: Prisma.SelectSubset<T, RoomPlayerDeleteArgs<ExtArgs>>): Prisma.Prisma__RoomPlayerClient<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RoomPlayerUpdateArgs>(args: Prisma.SelectSubset<T, RoomPlayerUpdateArgs<ExtArgs>>): Prisma.Prisma__RoomPlayerClient<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RoomPlayerDeleteManyArgs>(args?: Prisma.SelectSubset<T, RoomPlayerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RoomPlayerUpdateManyArgs>(args: Prisma.SelectSubset<T, RoomPlayerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RoomPlayerUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RoomPlayerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RoomPlayerUpsertArgs>(args: Prisma.SelectSubset<T, RoomPlayerUpsertArgs<ExtArgs>>): Prisma.Prisma__RoomPlayerClient<runtime.Types.Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RoomPlayerCountArgs>(args?: Prisma.Subset<T, RoomPlayerCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RoomPlayerCountAggregateOutputType> : number>;
    aggregate<T extends RoomPlayerAggregateArgs>(args: Prisma.Subset<T, RoomPlayerAggregateArgs>): Prisma.PrismaPromise<GetRoomPlayerAggregateType<T>>;
    groupBy<T extends RoomPlayerGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RoomPlayerGroupByArgs['orderBy'];
    } : {
        orderBy?: RoomPlayerGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RoomPlayerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoomPlayerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RoomPlayerFieldRefs;
}
export interface Prisma__RoomPlayerClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    room<T extends Prisma.RoomDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RoomDefaultArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RoomPlayerFieldRefs {
    readonly id: Prisma.FieldRef<"RoomPlayer", 'String'>;
    readonly roomId: Prisma.FieldRef<"RoomPlayer", 'String'>;
    readonly userId: Prisma.FieldRef<"RoomPlayer", 'String'>;
    readonly seatNo: Prisma.FieldRef<"RoomPlayer", 'Int'>;
    readonly role: Prisma.FieldRef<"RoomPlayer", 'String'>;
    readonly joinedAt: Prisma.FieldRef<"RoomPlayer", 'DateTime'>;
}
export type RoomPlayerFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelect<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    include?: Prisma.RoomPlayerInclude<ExtArgs> | null;
    where: Prisma.RoomPlayerWhereUniqueInput;
};
export type RoomPlayerFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelect<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    include?: Prisma.RoomPlayerInclude<ExtArgs> | null;
    where: Prisma.RoomPlayerWhereUniqueInput;
};
export type RoomPlayerFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type RoomPlayerFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type RoomPlayerFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type RoomPlayerCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelect<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    include?: Prisma.RoomPlayerInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoomPlayerCreateInput, Prisma.RoomPlayerUncheckedCreateInput>;
};
export type RoomPlayerCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RoomPlayerCreateManyInput | Prisma.RoomPlayerCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RoomPlayerCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    data: Prisma.RoomPlayerCreateManyInput | Prisma.RoomPlayerCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.RoomPlayerIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type RoomPlayerUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelect<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    include?: Prisma.RoomPlayerInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoomPlayerUpdateInput, Prisma.RoomPlayerUncheckedUpdateInput>;
    where: Prisma.RoomPlayerWhereUniqueInput;
};
export type RoomPlayerUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RoomPlayerUpdateManyMutationInput, Prisma.RoomPlayerUncheckedUpdateManyInput>;
    where?: Prisma.RoomPlayerWhereInput;
    limit?: number;
};
export type RoomPlayerUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoomPlayerUpdateManyMutationInput, Prisma.RoomPlayerUncheckedUpdateManyInput>;
    where?: Prisma.RoomPlayerWhereInput;
    limit?: number;
    include?: Prisma.RoomPlayerIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type RoomPlayerUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelect<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    include?: Prisma.RoomPlayerInclude<ExtArgs> | null;
    where: Prisma.RoomPlayerWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoomPlayerCreateInput, Prisma.RoomPlayerUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RoomPlayerUpdateInput, Prisma.RoomPlayerUncheckedUpdateInput>;
};
export type RoomPlayerDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelect<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    include?: Prisma.RoomPlayerInclude<ExtArgs> | null;
    where: Prisma.RoomPlayerWhereUniqueInput;
};
export type RoomPlayerDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoomPlayerWhereInput;
    limit?: number;
};
export type RoomPlayerDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoomPlayerSelect<ExtArgs> | null;
    omit?: Prisma.RoomPlayerOmit<ExtArgs> | null;
    include?: Prisma.RoomPlayerInclude<ExtArgs> | null;
};
