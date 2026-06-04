-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "splitMode" TEXT NOT NULL DEFAULT 'default';

-- CreateTable
CREATE TABLE "DefaultSplit" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "categoryId" TEXT,
    "tenantId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DefaultSplit_householdId_idx" ON "DefaultSplit"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultSplit_householdId_categoryId_tenantId_key" ON "DefaultSplit"("householdId", "categoryId", "tenantId");

-- AddForeignKey
ALTER TABLE "DefaultSplit" ADD CONSTRAINT "DefaultSplit_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaultSplit" ADD CONSTRAINT "DefaultSplit_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaultSplit" ADD CONSTRAINT "DefaultSplit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
