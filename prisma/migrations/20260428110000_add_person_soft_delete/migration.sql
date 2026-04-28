-- Add soft-delete support for published person cards
ALTER TABLE "Person"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Person_deletedAt_idx" ON "Person"("deletedAt");
