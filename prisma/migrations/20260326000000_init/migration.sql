-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AUTHOR', 'MODERATOR', 'ADMIN');
CREATE TYPE "ModerationStatus" AS ENUM ('draft', 'pending', 'needs_revision', 'approved', 'rejected');
CREATE TYPE "SubmissionType" AS ENUM ('create', 'update');
CREATE TYPE "EntityType" AS ENUM ('Person', 'ArchiveMaterial', 'Story', 'ChronicleEvent');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'AUTHOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Person" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "middleName" TEXT,
  "photoUrl" TEXT,
  "shortDescription" TEXT NOT NULL,
  "biography" TEXT NOT NULL,
  "universityRole" TEXT,
  "department" TEXT,
  "faculty" TEXT,
  "studyOrWorkYears" TEXT,
  "birthDate" TIMESTAMP(3),
  "deathDate" TIMESTAMP(3),
  "relatedPeriodText" TEXT,
  "sourceInfo" TEXT,
  "verificationStatus" TEXT,
  "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'draft',
  "submittedById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Person_slug_key" ON "Person"("slug");

CREATE TABLE "ArchiveMaterial" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "materialType" TEXT NOT NULL,
  "fileUrl" TEXT,
  "previewImageUrl" TEXT,
  "eventDate" TIMESTAMP(3),
  "sourceInfo" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'draft',
  "submittedById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArchiveMaterial_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ArchiveMaterial_slug_key" ON "ArchiveMaterial"("slug");

CREATE TABLE "Story" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "storyType" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "coverImageUrl" TEXT,
  "mediaUrl" TEXT,
  "sourceInfo" TEXT,
  "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'draft',
  "submittedById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

CREATE TABLE "ChronicleEvent" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "coverImageUrl" TEXT,
  "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'draft',
  "submittedById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChronicleEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChronicleEvent_slug_key" ON "ChronicleEvent"("slug");

CREATE TABLE "Submission" (
  "id" TEXT NOT NULL,
  "submissionType" "SubmissionType" NOT NULL,
  "targetEntityType" "EntityType" NOT NULL,
  "targetEntityId" TEXT,
  "payloadJson" JSONB NOT NULL,
  "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
  "moderatorComment" TEXT,
  "authorId" TEXT NOT NULL,
  "moderatorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_ArchiveMaterialToPerson" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_ArchiveMaterialToPerson_AB_unique" ON "_ArchiveMaterialToPerson"("A", "B");
CREATE INDEX "_ArchiveMaterialToPerson_B_index" ON "_ArchiveMaterialToPerson"("B");

CREATE TABLE "_PersonToStory" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_PersonToStory_AB_unique" ON "_PersonToStory"("A", "B");
CREATE INDEX "_PersonToStory_B_index" ON "_PersonToStory"("B");

CREATE TABLE "_ChronicleEventToPerson" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_ChronicleEventToPerson_AB_unique" ON "_ChronicleEventToPerson"("A", "B");
CREATE INDEX "_ChronicleEventToPerson_B_index" ON "_ChronicleEventToPerson"("B");

ALTER TABLE "Person" ADD CONSTRAINT "Person_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArchiveMaterial" ADD CONSTRAINT "ArchiveMaterial_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Story" ADD CONSTRAINT "Story_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChronicleEvent" ADD CONSTRAINT "ChronicleEvent_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_ArchiveMaterialToPerson" ADD CONSTRAINT "_ArchiveMaterialToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "ArchiveMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ArchiveMaterialToPerson" ADD CONSTRAINT "_ArchiveMaterialToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PersonToStory" ADD CONSTRAINT "_PersonToStory_A_fkey" FOREIGN KEY ("A") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PersonToStory" ADD CONSTRAINT "_PersonToStory_B_fkey" FOREIGN KEY ("B") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ChronicleEventToPerson" ADD CONSTRAINT "_ChronicleEventToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "ChronicleEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ChronicleEventToPerson" ADD CONSTRAINT "_ChronicleEventToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
