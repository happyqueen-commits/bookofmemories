const required = ["DATABASE_URL", "AUTH_SECRET"];

const missing = required.filter((name) => !process.env[name] || !String(process.env[name]).trim());
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

if (String(process.env.AUTH_SECRET).trim().length < 32) {
  console.error("AUTH_SECRET must be at least 32 characters long.");
  process.exit(1);
}

const databaseUrl = String(process.env.DATABASE_URL).trim();
if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  console.error("DATABASE_URL must start with postgresql:// or postgres://");
  process.exit(1);
}

const isVerificationEnabled = process.argv.includes("--check-db");

if (isVerificationEnabled) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    console.log("Environment check passed: database connection is available.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Database connection check failed. Verify DATABASE_URL credentials and server accessibility.");
    console.error(`Original error: ${message}`);
    process.exit(1);
  }
}
