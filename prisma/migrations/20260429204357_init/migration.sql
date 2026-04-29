-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'PLAYING', 'FINISHED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "openId" TEXT NOT NULL,
    "nickName" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "roleConfig" JSONB NOT NULL DEFAULT '{}',
    "maxPlayers" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_players" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seatNo" INTEGER NOT NULL,
    "role" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_records" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "roles" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "game_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_openId_key" ON "users"("openId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "rooms_code_idx" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "room_players_userId_idx" ON "room_players"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "room_players_roomId_userId_key" ON "room_players"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "room_players_roomId_seatNo_key" ON "room_players"("roomId", "seatNo");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_records" ADD CONSTRAINT "game_records_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
