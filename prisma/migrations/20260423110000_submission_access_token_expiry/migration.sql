ALTER TABLE "Submission"
ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3);

CREATE INDEX "Submission_contactEmail_accessTokenHash_idx" ON "Submission"("contactEmail", "accessTokenHash");
