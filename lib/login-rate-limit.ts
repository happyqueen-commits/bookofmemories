import { prisma } from "@/lib/prisma";

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_LOCK_MS = 15 * 60 * 1000;

type LoginAttemptDelegate = {
  findUnique: (args: { where: { key: string } }) => Promise<{
    attempts: number;
    windowStartedAt: Date;
    lockedUntil: Date | null;
  } | null>;
  create: (args: {
    data: {
      key: string;
      email: string;
      ip: string;
      attempts: number;
      windowStartedAt: Date;
      lastAttemptAt: Date;
    };
  }) => Promise<unknown>;
  update: (args: {
    where: { key: string };
    data: {
      attempts?: number;
      windowStartedAt?: Date;
      lastAttemptAt: Date;
      lockedUntil?: Date | null;
    };
  }) => Promise<unknown>;
  deleteMany: (args: { where: { key: string } }) => Promise<unknown>;
};

function getLoginAttemptDelegate() {
  const delegate = (prisma as unknown as { loginAttempt?: LoginAttemptDelegate }).loginAttempt;
  return delegate ?? null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeIp(ip: string) {
  return ip.trim() || "unknown";
}

export function getRateLimitKey(email: string, ip: string) {
  return `${normalizeEmail(email)}|${normalizeIp(ip)}`;
}

export async function getLoginRateLimitState(email: string, ip: string) {
  const loginAttempt = getLoginAttemptDelegate();
  if (!loginAttempt) {
    return { locked: false as const, remainingMs: 0, attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS };
  }

  const key = getRateLimitKey(email, ip);
  const now = new Date();
  const attempt = await loginAttempt.findUnique({ where: { key } });

  if (!attempt) {
    return { locked: false as const, remainingMs: 0, attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS };
  }

  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    return {
      locked: true as const,
      remainingMs: attempt.lockedUntil.getTime() - now.getTime(),
      attemptsLeft: 0
    };
  }

  if (now.getTime() - attempt.windowStartedAt.getTime() > RATE_LIMIT_WINDOW_MS) {
    return { locked: false as const, remainingMs: 0, attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS };
  }

  return {
    locked: false as const,
    remainingMs: 0,
    attemptsLeft: Math.max(RATE_LIMIT_MAX_ATTEMPTS - attempt.attempts, 0)
  };
}

export async function recordFailedLoginAttempt(email: string, ip: string) {
  const loginAttempt = getLoginAttemptDelegate();
  if (!loginAttempt) {
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedIp = normalizeIp(ip);
  const key = getRateLimitKey(normalizedEmail, normalizedIp);
  const now = new Date();

  const current = await loginAttempt.findUnique({ where: { key } });

  if (!current) {
    await loginAttempt.create({
      data: {
        key,
        email: normalizedEmail,
        ip: normalizedIp,
        attempts: 1,
        windowStartedAt: now,
        lastAttemptAt: now
      }
    });
    return;
  }

  if (current.lockedUntil && current.lockedUntil > now) {
    await loginAttempt.update({ where: { key }, data: { lastAttemptAt: now } });
    return;
  }

  const inCurrentWindow = now.getTime() - current.windowStartedAt.getTime() <= RATE_LIMIT_WINDOW_MS;
  const nextAttempts = inCurrentWindow ? current.attempts + 1 : 1;
  const shouldLock = nextAttempts >= RATE_LIMIT_MAX_ATTEMPTS;

  await loginAttempt.update({
    where: { key },
    data: {
      attempts: nextAttempts,
      windowStartedAt: inCurrentWindow ? current.windowStartedAt : now,
      lastAttemptAt: now,
      lockedUntil: shouldLock ? new Date(now.getTime() + RATE_LIMIT_LOCK_MS) : null
    }
  });
}

export async function clearLoginRateLimit(email: string, ip: string) {
  const loginAttempt = getLoginAttemptDelegate();
  if (!loginAttempt) {
    return;
  }

  const key = getRateLimitKey(email, ip);
  await loginAttempt.deleteMany({ where: { key } });
}

export function getClientIpFromHeaders(source: Headers) {
  const forwardedFor = source.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return source.get("x-real-ip")?.trim() || "unknown";
}
