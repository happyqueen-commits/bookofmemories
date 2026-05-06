-- Add legal consent timestamp for public submissions
ALTER TABLE "Submission"
ADD COLUMN "consentAcceptedAt" TIMESTAMP(3);
