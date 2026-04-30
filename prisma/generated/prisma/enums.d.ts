export declare const RoomStatus: {
    readonly WAITING: "WAITING";
    readonly PLAYING: "PLAYING";
    readonly FINISHED: "FINISHED";
};
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];
