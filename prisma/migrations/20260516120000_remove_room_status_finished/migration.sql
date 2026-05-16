-- Remove unused RoomStatus.FINISHED (never written by application; endGame returns to WAITING).
CREATE TYPE "RoomStatus_new" AS ENUM ('WAITING', 'PLAYING');

ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "rooms" ALTER COLUMN "status" TYPE "RoomStatus_new" USING (
  CASE "status"::text
    WHEN 'FINISHED' THEN 'WAITING'::"RoomStatus_new"
    ELSE "status"::text::"RoomStatus_new"
  END
);
ALTER TYPE "RoomStatus" RENAME TO "RoomStatus_old";
ALTER TYPE "RoomStatus_new" RENAME TO "RoomStatus";
DROP TYPE "RoomStatus_old";
ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'WAITING'::"RoomStatus";
