-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('AVALON', 'SGS');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "gameType" "GameType" NOT NULL DEFAULT 'AVALON';
