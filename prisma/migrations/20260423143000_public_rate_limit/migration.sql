-- CreateTable
CREATE TABLE "PublicRateLimit" (
    "key" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "windowKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "PublicRateLimit_ip_action_idx" ON "PublicRateLimit"("ip", "action");

-- CreateIndex
CREATE INDEX "PublicRateLimit_expiresAt_idx" ON "PublicRateLimit"("expiresAt");
