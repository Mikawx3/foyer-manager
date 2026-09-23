-- Track when a guest last opened the app so unused visits can expire.

ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "User" SET "lastSeenAt" = "createdAt";
