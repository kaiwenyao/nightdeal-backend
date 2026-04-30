import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type GameRecordModel = runtime.Types.Result.DefaultSelection<Prisma.$GameRecordPayload>;
export type AggregateGameRecord = {
    _count: GameRecordCountAggregateOutputType | null;
    _min: GameRecordMinAggregateOutputType | null;
    _max: GameRecordMaxAggregateOutputType | null;
};
export type GameRecordMinAggregateOutputType = {
    id: string | null;
    roomId: string | null;
    startedAt: Date | null;
    endedAt: Date | null;
};
export type GameRecordMaxAggregateOutputType = {
    id: string | null;
    roomId: string | null;
    startedAt: Date | null;
    endedAt: Date | null;
};
export type GameRecordCountAggregateOutputType = {
    id: number;
    roomId: number;
    roles: number;
    startedAt: number;
    endedAt: number;
    _all: number;
};
export type GameRecordMinAggregateInputType = {
    id?: true;
    roomId?: true;
    startedAt?: true;
    endedAt?: true;
};
export type GameRecordMaxAggregateInputType = {
    id?: true;
    roomId?: true;
    startedAt?: true;
    endedAt?: true;
};
export type GameRecordCountAggregateInputType = {
    id?: true;
    roomId?: true;
    roles?: true;
    startedAt?: true;
    endedAt?: true;
    _all?: true;
};
export type GameRecordAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.GameRecordWhereInput;
    orderBy?: Prisma.GameRecordOrderByWithRelationInput | Prisma.GameRecordOrderByWithRelationInput[];
    cursor?: Prisma.GameRecordWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | GameRecordCountAggregateInputType;
    _min?: GameRecordMinAggregateInputType;
    _max?: GameRecordMaxAggregateInputType;
};
export type GetGameRecordAggregateType<T extends GameRecordAggregateArgs> = {
    [P in keyof T & keyof AggregateGameRecord]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateGameRecord[P]> : Prisma.GetScalarType<T[P], AggregateGameRecord[P]>;
};
export type GameRecordGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.GameRecordWhereInput;
    orderBy?: Prisma.GameRecordOrderByWithAggregationInput | Prisma.GameRecordOrderByWithAggregationInput[];
    by: Prisma.GameRecordScalarFieldEnum[] | Prisma.GameRecordScalarFieldEnum;
    having?: Prisma.GameRecordScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: GameRecordCountAggregateInputType | true;
    _min?: GameRecordMinAggregateInputType;
    _max?: GameRecordMaxAggregateInputType;
};
export type GameRecordGroupByOutputType = {
    id: string;
    roomId: string;
    roles: runtime.JsonValue;
    startedAt: Date;
    endedAt: Date | null;
    _count: GameRecordCountAggregateOutputType | null;
    _min: GameRecordMinAggregateOutputType | null;
    _max: GameRecordMaxAggregateOutputType | null;
};
export type GetGameRecordGroupByPayload<T extends GameRecordGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<GameRecordGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof GameRecordGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], GameRecordGroupByOutputType[P]> : Prisma.GetScalarType<T[P], GameRecordGroupByOutputType[P]>;
}>>;
export type GameRecordWhereInput = {
    AND?: Prisma.GameRecordWhereInput | Prisma.GameRecordWhereInput[];
    OR?: Prisma.GameRecordWhereInput[];
    NOT?: Prisma.GameRecordWhereInput | Prisma.GameRecordWhereInput[];
    id?: Prisma.StringFilter<"GameRecord"> | string;
    roomId?: Prisma.StringFilter<"GameRecord"> | string;
    roles?: Prisma.JsonFilter<"GameRecord">;
    startedAt?: Prisma.DateTimeFilter<"GameRecord"> | Date | string;
    endedAt?: Prisma.DateTimeNullableFilter<"GameRecord"> | Date | string | null;
    room?: Prisma.XOR<Prisma.RoomScalarRelationFilter, Prisma.RoomWhereInput>;
};
export type GameRecordOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    roles?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    endedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    room?: Prisma.RoomOrderByWithRelationInput;
};
export type GameRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.GameRecordWhereInput | Prisma.GameRecordWhereInput[];
    OR?: Prisma.GameRecordWhereInput[];
    NOT?: Prisma.GameRecordWhereInput | Prisma.GameRecordWhereInput[];
    roomId?: Prisma.StringFilter<"GameRecord"> | string;
    roles?: Prisma.JsonFilter<"GameRecord">;
    startedAt?: Prisma.DateTimeFilter<"GameRecord"> | Date | string;
    endedAt?: Prisma.DateTimeNullableFilter<"GameRecord"> | Date | string | null;
    room?: Prisma.XOR<Prisma.RoomScalarRelationFilter, Prisma.RoomWhereInput>;
}, "id">;
export type GameRecordOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    roles?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    endedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.GameRecordCountOrderByAggregateInput;
    _max?: Prisma.GameRecordMaxOrderByAggregateInput;
    _min?: Prisma.GameRecordMinOrderByAggregateInput;
};
export type GameRecordScalarWhereWithAggregatesInput = {
    AND?: Prisma.GameRecordScalarWhereWithAggregatesInput | Prisma.GameRecordScalarWhereWithAggregatesInput[];
    OR?: Prisma.GameRecordScalarWhereWithAggregatesInput[];
    NOT?: Prisma.GameRecordScalarWhereWithAggregatesInput | Prisma.GameRecordScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"GameRecord"> | string;
    roomId?: Prisma.StringWithAggregatesFilter<"GameRecord"> | string;
    roles?: Prisma.JsonWithAggregatesFilter<"GameRecord">;
    startedAt?: Prisma.DateTimeWithAggregatesFilter<"GameRecord"> | Date | string;
    endedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"GameRecord"> | Date | string | null;
};
export type GameRecordCreateInput = {
    id?: string;
    roles: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Date | string;
    endedAt?: Date | string | null;
    room: Prisma.RoomCreateNestedOneWithoutGamesInput;
};
export type GameRecordUncheckedCreateInput = {
    id?: string;
    roomId: string;
    roles: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Date | string;
    endedAt?: Date | string | null;
};
export type GameRecordUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roles?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    room?: Prisma.RoomUpdateOneRequiredWithoutGamesNestedInput;
};
export type GameRecordUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roomId?: Prisma.StringFieldUpdateOperationsInput | string;
    roles?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type GameRecordCreateManyInput = {
    id?: string;
    roomId: string;
    roles: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Date | string;
    endedAt?: Date | string | null;
};
export type GameRecordUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roles?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type GameRecordUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roomId?: Prisma.StringFieldUpdateOperationsInput | string;
    roles?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type GameRecordListRelationFilter = {
    every?: Prisma.GameRecordWhereInput;
    some?: Prisma.GameRecordWhereInput;
    none?: Prisma.GameRecordWhereInput;
};
export type GameRecordOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type GameRecordCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    roles?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    endedAt?: Prisma.SortOrder;
};
export type GameRecordMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    endedAt?: Prisma.SortOrder;
};
export type GameRecordMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roomId?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    endedAt?: Prisma.SortOrder;
};
export type GameRecordCreateNestedManyWithoutRoomInput = {
    create?: Prisma.XOR<Prisma.GameRecordCreateWithoutRoomInput, Prisma.GameRecordUncheckedCreateWithoutRoomInput> | Prisma.GameRecordCreateWithoutRoomInput[] | Prisma.GameRecordUncheckedCreateWithoutRoomInput[];
    connectOrCreate?: Prisma.GameRecordCreateOrConnectWithoutRoomInput | Prisma.GameRecordCreateOrConnectWithoutRoomInput[];
    createMany?: Prisma.GameRecordCreateManyRoomInputEnvelope;
    connect?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
};
export type GameRecordUncheckedCreateNestedManyWithoutRoomInput = {
    create?: Prisma.XOR<Prisma.GameRecordCreateWithoutRoomInput, Prisma.GameRecordUncheckedCreateWithoutRoomInput> | Prisma.GameRecordCreateWithoutRoomInput[] | Prisma.GameRecordUncheckedCreateWithoutRoomInput[];
    connectOrCreate?: Prisma.GameRecordCreateOrConnectWithoutRoomInput | Prisma.GameRecordCreateOrConnectWithoutRoomInput[];
    createMany?: Prisma.GameRecordCreateManyRoomInputEnvelope;
    connect?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
};
export type GameRecordUpdateManyWithoutRoomNestedInput = {
    create?: Prisma.XOR<Prisma.GameRecordCreateWithoutRoomInput, Prisma.GameRecordUncheckedCreateWithoutRoomInput> | Prisma.GameRecordCreateWithoutRoomInput[] | Prisma.GameRecordUncheckedCreateWithoutRoomInput[];
    connectOrCreate?: Prisma.GameRecordCreateOrConnectWithoutRoomInput | Prisma.GameRecordCreateOrConnectWithoutRoomInput[];
    upsert?: Prisma.GameRecordUpsertWithWhereUniqueWithoutRoomInput | Prisma.GameRecordUpsertWithWhereUniqueWithoutRoomInput[];
    createMany?: Prisma.GameRecordCreateManyRoomInputEnvelope;
    set?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
    disconnect?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
    delete?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
    connect?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
    update?: Prisma.GameRecordUpdateWithWhereUniqueWithoutRoomInput | Prisma.GameRecordUpdateWithWhereUniqueWithoutRoomInput[];
    updateMany?: Prisma.GameRecordUpdateManyWithWhereWithoutRoomInput | Prisma.GameRecordUpdateManyWithWhereWithoutRoomInput[];
    deleteMany?: Prisma.GameRecordScalarWhereInput | Prisma.GameRecordScalarWhereInput[];
};
export type GameRecordUncheckedUpdateManyWithoutRoomNestedInput = {
    create?: Prisma.XOR<Prisma.GameRecordCreateWithoutRoomInput, Prisma.GameRecordUncheckedCreateWithoutRoomInput> | Prisma.GameRecordCreateWithoutRoomInput[] | Prisma.GameRecordUncheckedCreateWithoutRoomInput[];
    connectOrCreate?: Prisma.GameRecordCreateOrConnectWithoutRoomInput | Prisma.GameRecordCreateOrConnectWithoutRoomInput[];
    upsert?: Prisma.GameRecordUpsertWithWhereUniqueWithoutRoomInput | Prisma.GameRecordUpsertWithWhereUniqueWithoutRoomInput[];
    createMany?: Prisma.GameRecordCreateManyRoomInputEnvelope;
    set?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
    disconnect?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
    delete?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
    connect?: Prisma.GameRecordWhereUniqueInput | Prisma.GameRecordWhereUniqueInput[];
    update?: Prisma.GameRecordUpdateWithWhereUniqueWithoutRoomInput | Prisma.GameRecordUpdateWithWhereUniqueWithoutRoomInput[];
    updateMany?: Prisma.GameRecordUpdateManyWithWhereWithoutRoomInput | Prisma.GameRecordUpdateManyWithWhereWithoutRoomInput[];
    deleteMany?: Prisma.GameRecordScalarWhereInput | Prisma.GameRecordScalarWhereInput[];
};
export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
};
export type GameRecordCreateWithoutRoomInput = {
    id?: string;
    roles: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Date | string;
    endedAt?: Date | string | null;
};
export type GameRecordUncheckedCreateWithoutRoomInput = {
    id?: string;
    roles: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Date | string;
    endedAt?: Date | string | null;
};
export type GameRecordCreateOrConnectWithoutRoomInput = {
    where: Prisma.GameRecordWhereUniqueInput;
    create: Prisma.XOR<Prisma.GameRecordCreateWithoutRoomInput, Prisma.GameRecordUncheckedCreateWithoutRoomInput>;
};
export type GameRecordCreateManyRoomInputEnvelope = {
    data: Prisma.GameRecordCreateManyRoomInput | Prisma.GameRecordCreateManyRoomInput[];
    skipDuplicates?: boolean;
};
export type GameRecordUpsertWithWhereUniqueWithoutRoomInput = {
    where: Prisma.GameRecordWhereUniqueInput;
    update: Prisma.XOR<Prisma.GameRecordUpdateWithoutRoomInput, Prisma.GameRecordUncheckedUpdateWithoutRoomInput>;
    create: Prisma.XOR<Prisma.GameRecordCreateWithoutRoomInput, Prisma.GameRecordUncheckedCreateWithoutRoomInput>;
};
export type GameRecordUpdateWithWhereUniqueWithoutRoomInput = {
    where: Prisma.GameRecordWhereUniqueInput;
    data: Prisma.XOR<Prisma.GameRecordUpdateWithoutRoomInput, Prisma.GameRecordUncheckedUpdateWithoutRoomInput>;
};
export type GameRecordUpdateManyWithWhereWithoutRoomInput = {
    where: Prisma.GameRecordScalarWhereInput;
    data: Prisma.XOR<Prisma.GameRecordUpdateManyMutationInput, Prisma.GameRecordUncheckedUpdateManyWithoutRoomInput>;
};
export type GameRecordScalarWhereInput = {
    AND?: Prisma.GameRecordScalarWhereInput | Prisma.GameRecordScalarWhereInput[];
    OR?: Prisma.GameRecordScalarWhereInput[];
    NOT?: Prisma.GameRecordScalarWhereInput | Prisma.GameRecordScalarWhereInput[];
    id?: Prisma.StringFilter<"GameRecord"> | string;
    roomId?: Prisma.StringFilter<"GameRecord"> | string;
    roles?: Prisma.JsonFilter<"GameRecord">;
    startedAt?: Prisma.DateTimeFilter<"GameRecord"> | Date | string;
    endedAt?: Prisma.DateTimeNullableFilter<"GameRecord"> | Date | string | null;
};
export type GameRecordCreateManyRoomInput = {
    id?: string;
    roles: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Date | string;
    endedAt?: Date | string | null;
};
export type GameRecordUpdateWithoutRoomInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roles?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type GameRecordUncheckedUpdateWithoutRoomInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roles?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type GameRecordUncheckedUpdateManyWithoutRoomInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    roles?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type GameRecordSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roomId?: boolean;
    roles?: boolean;
    startedAt?: boolean;
    endedAt?: boolean;
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["gameRecord"]>;
export type GameRecordSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roomId?: boolean;
    roles?: boolean;
    startedAt?: boolean;
    endedAt?: boolean;
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["gameRecord"]>;
export type GameRecordSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roomId?: boolean;
    roles?: boolean;
    startedAt?: boolean;
    endedAt?: boolean;
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["gameRecord"]>;
export type GameRecordSelectScalar = {
    id?: boolean;
    roomId?: boolean;
    roles?: boolean;
    startedAt?: boolean;
    endedAt?: boolean;
};
export type GameRecordOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "roomId" | "roles" | "startedAt" | "endedAt", ExtArgs["result"]["gameRecord"]>;
export type GameRecordInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
};
export type GameRecordIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
};
export type GameRecordIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    room?: boolean | Prisma.RoomDefaultArgs<ExtArgs>;
};
export type $GameRecordPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "GameRecord";
    objects: {
        room: Prisma.$RoomPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        roomId: string;
        roles: runtime.JsonValue;
        startedAt: Date;
        endedAt: Date | null;
    }, ExtArgs["result"]["gameRecord"]>;
    composites: {};
};
export type GameRecordGetPayload<S extends boolean | null | undefined | GameRecordDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$GameRecordPayload, S>;
export type GameRecordCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<GameRecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: GameRecordCountAggregateInputType | true;
};
export interface GameRecordDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['GameRecord'];
        meta: {
            name: 'GameRecord';
        };
    };
    findUnique<T extends GameRecordFindUniqueArgs>(args: Prisma.SelectSubset<T, GameRecordFindUniqueArgs<ExtArgs>>): Prisma.Prisma__GameRecordClient<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends GameRecordFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, GameRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__GameRecordClient<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends GameRecordFindFirstArgs>(args?: Prisma.SelectSubset<T, GameRecordFindFirstArgs<ExtArgs>>): Prisma.Prisma__GameRecordClient<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends GameRecordFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, GameRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__GameRecordClient<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends GameRecordFindManyArgs>(args?: Prisma.SelectSubset<T, GameRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends GameRecordCreateArgs>(args: Prisma.SelectSubset<T, GameRecordCreateArgs<ExtArgs>>): Prisma.Prisma__GameRecordClient<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends GameRecordCreateManyArgs>(args?: Prisma.SelectSubset<T, GameRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends GameRecordCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, GameRecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends GameRecordDeleteArgs>(args: Prisma.SelectSubset<T, GameRecordDeleteArgs<ExtArgs>>): Prisma.Prisma__GameRecordClient<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends GameRecordUpdateArgs>(args: Prisma.SelectSubset<T, GameRecordUpdateArgs<ExtArgs>>): Prisma.Prisma__GameRecordClient<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends GameRecordDeleteManyArgs>(args?: Prisma.SelectSubset<T, GameRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends GameRecordUpdateManyArgs>(args: Prisma.SelectSubset<T, GameRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends GameRecordUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, GameRecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends GameRecordUpsertArgs>(args: Prisma.SelectSubset<T, GameRecordUpsertArgs<ExtArgs>>): Prisma.Prisma__GameRecordClient<runtime.Types.Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends GameRecordCountArgs>(args?: Prisma.Subset<T, GameRecordCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], GameRecordCountAggregateOutputType> : number>;
    aggregate<T extends GameRecordAggregateArgs>(args: Prisma.Subset<T, GameRecordAggregateArgs>): Prisma.PrismaPromise<GetGameRecordAggregateType<T>>;
    groupBy<T extends GameRecordGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: GameRecordGroupByArgs['orderBy'];
    } : {
        orderBy?: GameRecordGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, GameRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGameRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: GameRecordFieldRefs;
}
export interface Prisma__GameRecordClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    room<T extends Prisma.RoomDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RoomDefaultArgs<ExtArgs>>): Prisma.Prisma__RoomClient<runtime.Types.Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface GameRecordFieldRefs {
    readonly id: Prisma.FieldRef<"GameRecord", 'String'>;
    readonly roomId: Prisma.FieldRef<"GameRecord", 'String'>;
    readonly roles: Prisma.FieldRef<"GameRecord", 'Json'>;
    readonly startedAt: Prisma.FieldRef<"GameRecord", 'DateTime'>;
    readonly endedAt: Prisma.FieldRef<"GameRecord", 'DateTime'>;
}
export type GameRecordFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelect<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    include?: Prisma.GameRecordInclude<ExtArgs> | null;
    where: Prisma.GameRecordWhereUniqueInput;
};
export type GameRecordFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelect<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    include?: Prisma.GameRecordInclude<ExtArgs> | null;
    where: Prisma.GameRecordWhereUniqueInput;
};
export type GameRecordFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type GameRecordFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type GameRecordFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type GameRecordCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelect<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    include?: Prisma.GameRecordInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.GameRecordCreateInput, Prisma.GameRecordUncheckedCreateInput>;
};
export type GameRecordCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.GameRecordCreateManyInput | Prisma.GameRecordCreateManyInput[];
    skipDuplicates?: boolean;
};
export type GameRecordCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    data: Prisma.GameRecordCreateManyInput | Prisma.GameRecordCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.GameRecordIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type GameRecordUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelect<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    include?: Prisma.GameRecordInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.GameRecordUpdateInput, Prisma.GameRecordUncheckedUpdateInput>;
    where: Prisma.GameRecordWhereUniqueInput;
};
export type GameRecordUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.GameRecordUpdateManyMutationInput, Prisma.GameRecordUncheckedUpdateManyInput>;
    where?: Prisma.GameRecordWhereInput;
    limit?: number;
};
export type GameRecordUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.GameRecordUpdateManyMutationInput, Prisma.GameRecordUncheckedUpdateManyInput>;
    where?: Prisma.GameRecordWhereInput;
    limit?: number;
    include?: Prisma.GameRecordIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type GameRecordUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelect<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    include?: Prisma.GameRecordInclude<ExtArgs> | null;
    where: Prisma.GameRecordWhereUniqueInput;
    create: Prisma.XOR<Prisma.GameRecordCreateInput, Prisma.GameRecordUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.GameRecordUpdateInput, Prisma.GameRecordUncheckedUpdateInput>;
};
export type GameRecordDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelect<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    include?: Prisma.GameRecordInclude<ExtArgs> | null;
    where: Prisma.GameRecordWhereUniqueInput;
};
export type GameRecordDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.GameRecordWhereInput;
    limit?: number;
};
export type GameRecordDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.GameRecordSelect<ExtArgs> | null;
    omit?: Prisma.GameRecordOmit<ExtArgs> | null;
    include?: Prisma.GameRecordInclude<ExtArgs> | null;
};
