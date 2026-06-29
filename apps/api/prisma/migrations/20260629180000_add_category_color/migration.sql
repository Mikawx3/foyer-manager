-- AlterTable
ALTER TABLE "Category" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'other';

UPDATE "Category" SET "color" = 'rent' WHERE "slug" = 'rent';
UPDATE "Category" SET "color" = 'groceries' WHERE "slug" = 'groceries';
UPDATE "Category" SET "color" = 'utilities' WHERE "slug" = 'utilities';
UPDATE "Category" SET "color" = 'internet' WHERE "slug" = 'internet';
UPDATE "Category" SET "color" = 'streaming' WHERE "slug" = 'streaming';
UPDATE "Category" SET "color" = 'water' WHERE "slug" = 'water';
UPDATE "Category" SET "color" = 'insurance' WHERE "slug" = 'insurance';
UPDATE "Category" SET "color" = 'transport' WHERE "slug" = 'transport';
UPDATE "Category" SET "color" = 'health' WHERE "slug" = 'health';
UPDATE "Category" SET "color" = 'other' WHERE "slug" = 'other';
