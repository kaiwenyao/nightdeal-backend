-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "isRandomSeat" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "game_records_roomId_idx" ON "game_records"("roomId");

-- CreateIndex
CREATE INDEX "rooms_updatedAt_idx" ON "rooms"("updatedAt");
