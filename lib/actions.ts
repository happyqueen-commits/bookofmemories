"use server";

import { EntityType, ModerationStatus, Role, SubmissionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { AuthError } from "next-auth";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signIn, signOut } from "@/lib/auth";
import { getClientIpFromHeaders, getLoginRateLimitState } from "@/lib/login-rate-limit";
import { passwordSchema } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";
import { deliverPasswordResetToken } from "@/lib/password-reset-delivery";
import { deliverSubmissionAccessCode } from "@/lib/submission-access-delivery";
import { parsePersonName } from "@/lib/person-name";
import { generateUniquePersonSlug } from "@/lib/slug";
import { checkPublicRateLimit } from "@/lib/public-rate-limit";

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().min(1).optional());

const optionalUrl = optionalTrimmedString.pipe(z.string().url().optional());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date;
}, z.date().optional());

const optionalStringArrayFromLines = z.preprocess((value) => {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}, z.array(z.string().url()).max(10).default([]));

function formatSubmitValidationIssue(issue?: z.ZodIssue) {
  if (!issue) {
    return {
      field: "form",
      message: "Проверьте форму.",
      line: undefined as number | undefined
    };
  }

  const pathRoot = typeof issue.path[0] === "string" ? issue.path[0] : "form";
  const pathIndex = typeof issue.path[1] === "number" ? issue.path[1] : undefined;

  if (pathRoot === "photoUrls" && pathIndex !== undefined) {
    return {
      field: "photoUrls",
      message: "Укажите полный URL изображения (например, https://example.com/photo.jpg).",
      line: pathIndex + 1
    };
  }

  return {
    field: pathRoot,
    message: issue.message || "Проверьте форму.",
    line: undefined as number | undefined
  };
}

const personSchema = z.object({
  targetEntityType: z.literal("Person"),
  fullName: z.string().trim().min(2),
  biography: z.string().trim().min(10),
  shortDescription: z.string().trim().min(3).optional().or(z.literal("")),
  birthDate: optionalDate,
  deathDate: optionalDate,
  faculty: optionalTrimmedString,
  department: optionalTrimmedString,
  photoUrls: optionalStringArrayFromLines,
  uploadedPhotoUrl: optionalUrl,
  website: z.string().trim().optional().default("")
});

const submitContactSchema = z.object({
  contactName: z.string().trim().min(2, "Укажите имя для обратной связи."),
  contactEmail: z.string().trim().email("Укажите корректный email для обратной связи.")
});

const submissionCodeRequestSchema = z.object({
  email: z.string().trim().email("Укажите корректный email.")
});

const submissionCodeVerifySchema = z.object({
  email: z.string().trim().email("Укажите корректный email."),
  code: z.string().trim().regex(/^\d{6}$/, "Введите шестизначный код.")
});

const moderateSchema = z.object({
  submissionId: z.string().cuid(),
  status: z.enum(["approved", "needs_revision", "rejected"]),
  moderatorComment: z.string().max(2000).optional().or(z.literal(""))
});

const SUBMISSION_ACCESS_CODE_TTL_MINUTES = 15;
const SUBMISSION_ACCESS_CODE_COOLDOWN_SECONDS = 60;
const SUBMISSION_ACCESS_CODE_MAX_ATTEMPTS = 5;
const SUBMISSION_SESSION_TTL_MINUTES = 30;
const SUBMISSION_STATUS_SESSION_COOKIE = "submission_status_session";

export type RegisterActionState = {
  status: "idle" | "error" | "success";
  errors?: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  formError?: string;
  successMessage?: string;
};

export type ForgotPasswordActionState = {
  status: "idle" | "error" | "success";
  error?: string;
  message?: string;
};

export type ResetPasswordActionState = {
  status: "idle" | "error" | "success";
  error?: string;
  message?: string;
};

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Введите корректный email.")
});

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Токен сброса не найден."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Подтвердите пароль.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают.",
    path: ["confirmPassword"]
  });

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestHeaders = headers();
  const ip = getClientIpFromHeaders(requestHeaders);

  if (!email || !password) {
    redirect("/account?error=empty_fields");
  }

  const rateLimit = await getLoginRateLimitState(email, ip);
  if (rateLimit.locked) {
    redirect("/account?error=too_many_attempts");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      ip,
      redirectTo: "/account"
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      const updatedRateLimit = await getLoginRateLimitState(email, ip);
      if (updatedRateLimit.locked) {
        redirect("/account?error=too_many_attempts");
      }
      redirect("/account?error=invalid_credentials");
    }
    throw error;
  }
}

export async function registerAction(
  _: RegisterActionState,
  _formData: FormData
): Promise<RegisterActionState> {
  return {
    status: "error",
    formError: "Самостоятельная регистрация отключена. Доступ выдают администраторы проекта."
  };
}

const FORGOT_PASSWORD_NEUTRAL_MESSAGE = "Если email зарегистрирован, инструкция отправлена";

export async function forgotPasswordAction(
  _: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { status: "error", error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Некорректный email." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    try {
      await deliverPasswordResetToken(email, rawToken);
    } catch (error) {
      console.error("[password-reset] Failed to deliver reset token", error);
    }
  }

  return {
    status: "success",
    message: FORGOT_PASSWORD_NEUTRAL_MESSAGE
  };
}

export async function resetPasswordAction(
  _: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      error: fields.password?.[0] ?? fields.confirmPassword?.[0] ?? fields.token?.[0] ?? "Проверьте форму."
    };
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const now = new Date();
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!token || token.usedAt || token.expiresAt <= now) {
    return { status: "error", error: "Ссылка недействительна или истекла." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { email: token.email }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: now } })
  ]);

  return { status: "success", message: "Пароль обновлен. Теперь войдите с новым паролем." };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

function generateSubmissionAccessCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

async function issueSubmissionAccessCode(email: string) {
  const now = new Date();
  const normalizedEmail = email.toLowerCase();
  const submissions = await prisma.submission.findMany({
    where: { contactEmail: normalizedEmail },
    select: { id: true }
  });

  if (submissions.length === 0) {
    return { sent: false as const, reason: "not_found" as const };
  }

  const latestCode = await prisma.submissionAccessCode.findFirst({
    where: {
      email: normalizedEmail,
      usedAt: null,
      invalidatedAt: null,
      expiresAt: { gt: now }
    },
    orderBy: { createdAt: "desc" },
    select: { lastSentAt: true }
  });

  if (latestCode) {
    const diffMs = now.getTime() - latestCode.lastSentAt.getTime();
    if (diffMs < SUBMISSION_ACCESS_CODE_COOLDOWN_SECONDS * 1000) {
      return {
        sent: false as const,
        reason: "cooldown" as const,
        retryAfterSeconds: Math.ceil((SUBMISSION_ACCESS_CODE_COOLDOWN_SECONDS * 1000 - diffMs) / 1000)
      };
    }
  }

  const sentLastHour = await prisma.submissionAccessCode.count({
    where: {
      email: normalizedEmail,
      createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) }
    }
  });
  if (sentLastHour >= 10) {
    return { sent: false as const, reason: "email_limit" as const };
  }

  const code = generateSubmissionAccessCode();
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(now.getTime() + SUBMISSION_ACCESS_CODE_TTL_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.submissionAccessCode.updateMany({
      where: {
        email: normalizedEmail,
        usedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now }
      },
      data: { invalidatedAt: now }
    }),
    prisma.submissionAccessCode.createMany({
      data: submissions.map((submission) => ({
        submissionId: submission.id,
        email: normalizedEmail,
        codeHash,
        expiresAt,
        lastSentAt: now
      }))
    })
  ]);

  await deliverSubmissionAccessCode(normalizedEmail, code, SUBMISSION_ACCESS_CODE_TTL_MINUTES);
  return { sent: true as const };
}

export async function submitMaterialAction(formData: FormData) {
  const requestHeaders = headers();
  const ip = getClientIpFromHeaders(requestHeaders);
  const rateLimit = await checkPublicRateLimit(ip, "submit");

  if (!rateLimit.allowed) {
    const params = new URLSearchParams({
      error: "invalid_form",
      field: "form",
      message: "Слишком много попыток отправки. Повторите позже."
    });
    redirect(`/submit?${params.toString()}`);
  }

  const contactParsed = submitContactSchema.safeParse({
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail")
  });

  const parsed = personSchema.safeParse({
    targetEntityType: formData.get("targetEntityType"),
    fullName: formData.get("fullName"),
    biography: formData.get("biography"),
    shortDescription: formData.get("shortDescription"),
    birthDate: formData.get("birthDate"),
    deathDate: formData.get("deathDate"),
    faculty: formData.get("faculty"),
    department: formData.get("department"),
    photoUrls: formData.get("photoUrls"),
    uploadedPhotoUrl: formData.get("uploadedPhotoUrl"),
    website: formData.get("website")
  });

  if (!parsed.success || !contactParsed.success) {
    const issue = !contactParsed.success
      ? contactParsed.error.issues[0]
      : !parsed.success
        ? parsed.error.issues[0]
        : undefined;
    const { field, message, line } = formatSubmitValidationIssue(issue);
    const params = new URLSearchParams({
      error: "invalid_form",
      field,
      message,
      contactName: String(formData.get("contactName") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      biography: String(formData.get("biography") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      deathDate: String(formData.get("deathDate") ?? ""),
      faculty: String(formData.get("faculty") ?? ""),
      department: String(formData.get("department") ?? ""),
      shortDescription: String(formData.get("shortDescription") ?? ""),
      photoUrls: String(formData.get("photoUrls") ?? "")
    });
    if (typeof line === "number") {
      params.set("line", String(line));
    }
    redirect(`/submit?${params.toString()}`);
  }

  if (parsed.data.website) {
    redirect("/submit?success=submitted");
  }

  const normalizedEmail = contactParsed.data.contactEmail.toLowerCase();

  await prisma.submission.create({
    data: {
      authorId: null,
      contactName: contactParsed.data.contactName,
      contactEmail: normalizedEmail,
      payloadJson: {
        ...parsed.data,
        website: undefined
      },
      submissionType: SubmissionType.create,
      targetEntityType: EntityType.Person,
      status: ModerationStatus.pending
    },
    select: { id: true }
  });

  revalidatePath("/submission-status");
  revalidatePath("/admin");

  try {
    await issueSubmissionAccessCode(normalizedEmail);
  } catch (error) {
    console.error("[submission-access] failed to send initial code", error);
  }

  const successParams = new URLSearchParams({
    success: "submitted",
    codeSent: "1",
    email: normalizedEmail
  });
  redirect(`/submit?${successParams.toString()}`);
}

export async function requestSubmissionStatusCodeAction(formData: FormData) {
  const parsed = submissionCodeRequestSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect("/submission-status?codeRequestError=invalid_email");
  }

  const email = parsed.data.email.toLowerCase();
  const ip = getClientIpFromHeaders(headers());
  const rateLimit = await checkPublicRateLimit(ip, "submissionCodeSend");
  if (!rateLimit.allowed) {
    redirect(`/submission-status?email=${encodeURIComponent(email)}&codeRequestError=too_many_requests`);
  }

  try {
    const result = await issueSubmissionAccessCode(email);
    if (!result.sent) {
      if (result.reason === "cooldown") {
        redirect(
          `/submission-status?email=${encodeURIComponent(email)}&codeRequestError=cooldown&retryAfter=${result.retryAfterSeconds ?? SUBMISSION_ACCESS_CODE_COOLDOWN_SECONDS}`
        );
      }
      if (result.reason === "email_limit") {
        redirect(`/submission-status?email=${encodeURIComponent(email)}&codeRequestError=email_limit`);
      }
      redirect(`/submission-status?email=${encodeURIComponent(email)}&codeRequested=1`);
    }
  } catch (error) {
    console.error("[submission-access] Failed to send code", error);
    redirect(`/submission-status?email=${encodeURIComponent(email)}&codeRequestError=delivery_failed`);
  }

  redirect(`/submission-status?email=${encodeURIComponent(email)}&codeRequested=1`);
}

export async function verifySubmissionStatusCodeAction(formData: FormData) {
  const parsed = submissionCodeVerifySchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code")
  });

  if (!parsed.success) {
    redirect("/submission-status?verifyError=invalid_input");
  }

  const email = parsed.data.email.toLowerCase();
  const code = parsed.data.code;
  const now = new Date();
  const ip = getClientIpFromHeaders(headers());
  const rateLimit = await checkPublicRateLimit(ip, "submissionCodeVerify");
  if (!rateLimit.allowed) {
    redirect(`/submission-status?email=${encodeURIComponent(email)}&verifyError=too_many_attempts`);
  }

  const activeCodes = await prisma.submissionAccessCode.findMany({
    where: {
      email,
      usedAt: null,
      invalidatedAt: null,
      expiresAt: { gt: now }
    },
    select: {
      id: true,
      codeHash: true,
      attemptCount: true,
      submissionId: true
    }
  });

  if (activeCodes.length === 0) {
    redirect(`/submission-status?email=${encodeURIComponent(email)}&verifyError=expired`);
  }

  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const matchedCodes = activeCodes.filter(
    (accessCode) => accessCode.codeHash === codeHash && accessCode.attemptCount < SUBMISSION_ACCESS_CODE_MAX_ATTEMPTS
  );

  if (matchedCodes.length === 0) {
    await prisma.submissionAccessCode.updateMany({
      where: {
        id: { in: activeCodes.map((accessCode) => accessCode.id) },
        attemptCount: { lt: SUBMISSION_ACCESS_CODE_MAX_ATTEMPTS }
      },
      data: { attemptCount: { increment: 1 } }
    });
    redirect(`/submission-status?email=${encodeURIComponent(email)}&verifyError=invalid_code`);
  }

  const rawSessionToken = crypto.randomBytes(32).toString("base64url");
  const sessionTokenHash = crypto.createHash("sha256").update(rawSessionToken).digest("hex");
  const sessionExpiresAt = new Date(now.getTime() + SUBMISSION_SESSION_TTL_MINUTES * 60 * 1000);
  const submissionIds = Array.from(new Set(matchedCodes.map((codeEntry) => codeEntry.submissionId)));

  await prisma.$transaction([
    prisma.submissionAccessCode.updateMany({
      where: { id: { in: matchedCodes.map((accessCode) => accessCode.id) } },
      data: { usedAt: now }
    }),
    prisma.submission.updateMany({
      where: { id: { in: submissionIds } },
      data: { emailVerifiedAt: now }
    }),
    prisma.submissionAccessSession.create({
      data: {
        email,
        tokenHash: sessionTokenHash,
        expiresAt: sessionExpiresAt
      }
    })
  ]);

  const cookieStore = await cookies();
  cookieStore.set(SUBMISSION_STATUS_SESSION_COOKIE, rawSessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: sessionExpiresAt
  });

  redirect("/submission-status?verified=1");
}

export async function moderateSubmissionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN)) {
    throw new Error("Недостаточно прав");
  }

  const rawModerationInput = {
    submissionId: String(formData.get("submissionId") ?? ""),
    status: String(formData.get("status") ?? ""),
    moderatorComment: String(formData.get("moderatorComment") ?? "")
  };

  const parsed = moderateSchema.safeParse(rawModerationInput);
  if (!parsed.success) {
    throw new Error("Не удалось обработать форму модерации. Проверьте заполненные поля.");
  }

  const { submissionId, status, moderatorComment } = parsed.data;

  const existingSubmission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true }
  });

  if (!existingSubmission) {
    throw new Error("Заявка не найдена.");
  }

  await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.update({
      where: { id: submissionId },
      data: { status, moderatorComment, moderatorId: session.user.id }
    });

    if (status !== ModerationStatus.approved || submission.targetEntityId) {
      return;
    }

    if (submission.targetEntityType !== EntityType.Person) {
      throw new Error("В текущем MVP автопубликация поддерживается только для Person.");
    }

    const payloadResult = personSchema.safeParse(submission.payloadJson);
    if (!payloadResult.success) {
      throw new Error("Невалидный payload заявки, публикация невозможна.");
    }

    const payload = payloadResult.data;
    const personPhotoUrls = Array.from(new Set([...payload.photoUrls, ...(payload.uploadedPhotoUrl ? [payload.uploadedPhotoUrl] : [])]));
    const slug = await generateUniquePersonSlug(payload.fullName);
    const parsedName = parsePersonName(payload.fullName);

    const createdPerson = await tx.person.create({
      data: {
        moderationStatus: ModerationStatus.approved,
        publishedAt: new Date(),
        submittedById: submission.authorId,
        slug,
        fullName: payload.fullName,
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
        middleName: parsedName.middleName,
        shortDescription: payload.shortDescription || payload.biography.slice(0, 240),
        biography: payload.biography,
        birthDate: payload.birthDate,
        deathDate: payload.deathDate,
        faculty: payload.faculty,
        department: payload.department,
        photoUrl: personPhotoUrls[0] ?? null,
        photoUrls: personPhotoUrls
      }
    });

    await tx.submission.update({
      where: { id: submission.id },
      data: { targetEntityId: createdPerson.id }
    });
  });

  revalidatePath("/admin");
  revalidatePath("/memory");
  revalidatePath("/");
}
