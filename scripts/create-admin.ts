import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

function getArg(name: string) {
  const pref = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(pref));
  return match ? match.slice(pref.length).trim() : "";
}

async function main() {
  const email = getArg("email").toLowerCase();
  const password = getArg("password");
  const name = getArg("name") || "Administrator";
  const roleRaw = (getArg("role") || "ADMIN").toUpperCase();
  const role = roleRaw === "MODERATOR" ? Role.MODERATOR : Role.ADMIN;

  if (!email || !password) {
    throw new Error("Usage: npm run admin:create -- --email=admin@example.com --password='StrongPass123' [--name='Admin'] [--role=ADMIN|MODERATOR]");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { name, email, role, passwordHash }
  });

  console.log(`Admin user ensured: ${email} (${role})`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
