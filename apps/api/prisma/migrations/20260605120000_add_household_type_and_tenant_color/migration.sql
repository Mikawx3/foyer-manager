-- AlterTable
ALTER TABLE "Household" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'shared';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "color" TEXT;
