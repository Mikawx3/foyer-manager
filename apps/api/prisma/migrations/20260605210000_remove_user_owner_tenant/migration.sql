-- Drop profile owner linkage from users.
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_ownerTenantId_fkey";
DROP INDEX IF EXISTS "User_ownerTenantId_key";
ALTER TABLE "User" DROP COLUMN IF EXISTS "ownerTenantId";
