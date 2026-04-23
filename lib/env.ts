function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAppBaseUrl() {
  return process.env.NEXTAUTH_URL?.trim() || process.env.APP_URL?.trim() || "http://localhost:3000";
}

export function getDatabaseUrl() {
  return requiredEnv("DATABASE_URL");
}

export function getAuthSecret() {
  return requiredEnv("AUTH_SECRET");
}
