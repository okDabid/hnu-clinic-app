-- Convert any remaining ADMIN users to NURSE before dropping the enum value
UPDATE "Users" SET "role" = 'NURSE' WHERE "role" = 'ADMIN';

-- Recreate the Role enum without the ADMIN value
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('NURSE', 'DOCTOR', 'SCHOLAR', 'PATIENT');
ALTER TABLE "Users"
    ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
DROP TYPE "Role_old";
