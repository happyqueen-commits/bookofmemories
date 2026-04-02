ALTER TABLE "Submission"
ADD COLUMN "accessTokenHash" TEXT;

CREATE INDEX "Submission_accessTokenHash_idx" ON "Submission"("accessTokenHash");
