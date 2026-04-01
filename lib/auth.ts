import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CredentialsSignin } from "@auth/core/errors";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import {
  clearLoginRateLimit,
  getLoginRateLimitState,
  recordFailedLoginAttempt
} from "@/lib/login-rate-limit";
import { prisma } from "@/lib/prisma";

class LoginRejectedError extends CredentialsSignin {
  constructor(code: "invalid_input" | "invalid_credentials" | "too_many_attempts") {
    super();
    this.code = code;
  }
}

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  ip: z.string().optional()
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/account" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
        ip: { label: "IP", type: "text" }
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          throw new LoginRejectedError("invalid_input");
        }

        const email = parsed.data.email.toLowerCase();
        const ip = parsed.data.ip ?? "unknown";

        const rateLimitState = await getLoginRateLimitState(email, ip);
        if (rateLimitState.locked) {
          throw new LoginRejectedError("too_many_attempts");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await recordFailedLoginAttempt(email, ip);
          throw new LoginRejectedError("invalid_credentials");
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isValid) {
          await recordFailedLoginAttempt(email, ip);
          throw new LoginRejectedError("invalid_credentials");
        }

        if (user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
          await recordFailedLoginAttempt(email, ip);
          throw new LoginRejectedError("invalid_credentials");
        }

        await clearLoginRateLimit(email, ip);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          authContext: { loginErrorCode: null }
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.role = (user as { role?: Role }).role ?? Role.MODERATOR;
        token.loginErrorCode = (user as { authContext?: { loginErrorCode?: string | null } }).authContext?.loginErrorCode ?? null;
      }

      if (trigger === "signIn") {
        token.loginErrorCode = null;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role) ?? Role.MODERATOR;
      }
      return session;
    }
  }
});
