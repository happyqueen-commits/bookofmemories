-- AlterTable
ALTER TABLE "Submission"
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ALTER COLUMN   "authorId" DROP NOT NULL;

-- Backfill existing rows from author relation where possible
UPDATE "Submission" s
SET "contactName" = u."name",
    "contactEmail" = u."email"
FROM "User" u
WHERE s."authorId" = u."id";

-- Fallback for orphaned historical rows
UPDATE "Submission"
SET "contactName" = COALESCE("contactName", 'Не указан'),
    "contactEmail" = COALESCE("contactEmail", 'unknown@example.com');

-- Enforce required contact fields
ALTER TABLE "Submission"
ALTER COLUMN "contactName" SET NOT NULL,
ALTER COLUMN "contactEmail" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Submission_contactEmail_idx" ON "Submission"("contactEmail");
