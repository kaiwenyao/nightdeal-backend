-- Add a DB-side presence generation so cleanup cannot delete a player who
-- reconnected after a Redis presence lease changed owners.
ALTER TABLE "room_players"
ADD COLUMN "presenceVersion" INTEGER NOT NULL DEFAULT 0;
