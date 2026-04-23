import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const LIMITS = {
  submit: 8,
  upload: 20,
  statusLookup: 40
} as const;

type PublicAction = keyof typeof LIMITS;

function getWindowKey(now: Date) {
  return Math.floor(now.getTime() / WINDOW_MS).toString();
}

function buildKey(ip: string, action: PublicAction, windowKey: string) {
  return `public:${action}:${ip || "unknown"}:${windowKey}`;
}

export async function checkPublicRateLimit(ip: string, action: PublicAction) {
  const now = new Date();
  const windowKey = getWindowKey(now);
  const limit = LIMITS[action];
  const key = buildKey(ip, action, windowKey);

  const current = await prisma.publicRateLimit.upsert({
    where: { key },
    create: {
      key,
      ip: ip || "unknown",
      action,
      windowKey,
      count: 1,
      expiresAt: new Date(now.getTime() + WINDOW_MS)
    },
    update: {
      count: { increment: 1 },
      expiresAt: new Date(now.getTime() + WINDOW_MS)
    },
    select: { count: true }
  });

  return {
    allowed: current.count <= limit,
    limit,
    current: current.count,
    retryAfterSeconds: Math.ceil((WINDOW_MS - (now.getTime() % WINDOW_MS)) / 1000)
  };
}

export async function cleanupExpiredPublicRateLimits() {
  await prisma.publicRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
