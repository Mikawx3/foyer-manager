-- AlterTable
ALTER TABLE "Category" ADD COLUMN "slug" TEXT;

-- Backfill default category slugs
UPDATE "Category" SET slug = LOWER(name)
WHERE name IN ('Rent','Groceries','Utilities','Internet','Streaming','Water','Insurance','Transport','Health','Other');
