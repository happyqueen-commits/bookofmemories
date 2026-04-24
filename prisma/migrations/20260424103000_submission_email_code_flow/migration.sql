ALTER TABLE "Submission"
DROP COLUMN "accessTokenHash",
DROP COLUMN "accessTokenExpiresAt",
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "Submission_accessTokenHash_idx";
DROP INDEX IF EXISTS "Submission_contactEmail_accessTokenHash_idx";
CREATE INDEX "Submission_emailVerifiedAt_idx" ON "Submission"("emailVerifiedAt");

CREATE TABLE "SubmissionAccessCode" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubmissionAccessCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubmissionAccessSession" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubmissionAccessSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubmissionAccessSession_tokenHash_key" ON "SubmissionAccessSession"("tokenHash");
CREATE INDEX "SubmissionAccessCode_submissionId_email_idx" ON "SubmissionAccessCode"("submissionId", "email");
CREATE INDEX "SubmissionAccessCode_email_expiresAt_idx" ON "SubmissionAccessCode"("email", "expiresAt");
CREATE INDEX "SubmissionAccessCode_codeHash_idx" ON "SubmissionAccessCode"("codeHash");
CREATE INDEX "SubmissionAccessSession_email_expiresAt_idx" ON "SubmissionAccessSession"("email", "expiresAt");

ALTER TABLE "SubmissionAccessCode" ADD CONSTRAINT "SubmissionAccessCode_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
