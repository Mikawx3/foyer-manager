-- CreateTable
CREATE TABLE "IncomeTemplate" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncomeTemplate_householdId_idx" ON "IncomeTemplate"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeTemplate_householdId_tenantId_label_key" ON "IncomeTemplate"("householdId", "tenantId", "label");

-- AddForeignKey
ALTER TABLE "IncomeTemplate" ADD CONSTRAINT "IncomeTemplate_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeTemplate" ADD CONSTRAINT "IncomeTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
