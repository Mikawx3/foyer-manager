-- AlterTable
ALTER TABLE "User" ADD COLUMN "ownerTenantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_ownerTenantId_key" ON "User"("ownerTenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ownerTenantId_fkey" FOREIGN KEY ("ownerTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
