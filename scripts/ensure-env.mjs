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
