"use server";

import { EntityType, ModerationStatus, Role, SubmissionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signIn, signOut } from "@/lib/auth";
import { getClientIpFromHeaders, getLoginRateLimitState } from "@/lib/login-rate-limit";
import { passwordSchema } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";

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
}, z.array(z.string()).superRefine((urls, ctx) => {
  urls.forEach((url, index) => {
    if (!z.string().url().safeParse(url).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index],
        message: `Некорректный URL в строке ${index + 1}.`
      });
    }
  });
}).default([]));

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
  const message = issue.message?.trim();
  const genericMessages = new Set(["Invalid input", "Invalid input: expected string, received null"]);
  const fallbackMessage = genericMessages.has(message)
    ? "Проверьте заполнение формы."
    : message || "Проверьте форму.";

  if (pathRoot === "photoUrls" && pathIndex !== undefined) {
    return {
      field: "photoUrls",
      message: "Укажите полный URL изображения (например, https://example.com/photo.jpg).",
      line: pathIndex + 1
    };
  }

  return {
    field: pathRoot,
    message: fallbackMessage,
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
  photoUrls: optionalStringArrayFromLines
});

const storySchema = z.object({
  targetEntityType: z.literal("Story"),
  title: z.string().trim().min(2),
  storyType: z.string().trim().min(2),
  excerpt: z.string().trim().min(3),
  content: z.string().trim().min(10),
  sourceInfo: optionalTrimmedString
});

const submitSchema = z.discriminatedUnion("targetEntityType", [
  personSchema,
  storySchema
]);

const submitContactSchema = z.object({
  contactName: z.string().trim().min(2, "Укажите имя для обратной связи."),
  contactEmail: z.string().trim().email("Укажите корректный email для обратной связи."),
  submissionId: z.string().cuid().optional().or(z.literal("")),
  accessToken: z.string().trim().min(32).optional().or(z.literal(""))
});

const moderateSchema = z.object({
  submissionId: z.string().cuid(),
  status: z.enum(["approved", "needs_revision", "rejected"]),
  moderatorComment: z.string().max(2000).optional().or(z.literal(""))
});

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

    return {
      status: "success",
      message: `Инструкция отправлена. Тестовый токен (для dev): ${rawToken}`
    };
  }

  return {
    status: "success",
    message: "Если такой email зарегистрирован, инструкция по сбросу уже отправлена."
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

export async function submitMaterialAction(formData: FormData) {
  const contactParsed = submitContactSchema.safeParse({
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    submissionId: String(formData.get("submissionId") ?? ""),
    accessToken: String(formData.get("accessToken") ?? "")
  });
  const parsed = submitSchema.safeParse({
    targetEntityType: formData.get("targetEntityType"),
    fullName: formData.get("fullName"),
    biography: formData.get("biography"),
    shortDescription: formData.get("shortDescription"),
    birthDate: formData.get("birthDate"),
    deathDate: formData.get("deathDate"),
    faculty: formData.get("faculty"),
    department: formData.get("department"),
    title: formData.get("title"),
    description: formData.get("description"),
    materialType: formData.get("materialType"),
    sourceInfo: formData.get("sourceInfo"),
    tags: formData.get("tags"),
    fileUrl: formData.get("fileUrl"),
    previewImageUrl: formData.get("previewImageUrl"),
    storyType: formData.get("storyType"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverImageUrl: formData.get("coverImageUrl"),
    photoUrls: formData.get("photoUrls")
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

  const normalizedEmail = contactParsed.data.contactEmail.toLowerCase();
  const accessTokenHash = contactParsed.data.accessToken
    ? crypto.createHash("sha256").update(contactParsed.data.accessToken).digest("hex")
    : null;

  if (contactParsed.data.submissionId) {
    if (!accessTokenHash) {
      redirect(`/submit?error=invalid_form&field=form&message=${encodeURIComponent("Для доработки нужен ключ доступа к заявке")}`);
    }

    const updated = await prisma.submission.updateMany({
      where: {
        id: contactParsed.data.submissionId,
        contactEmail: normalizedEmail,
        accessTokenHash
      },
      data: {
        payloadJson: parsed.data,
        contactName: contactParsed.data.contactName,
        status: ModerationStatus.pending,
        moderatorComment: null,
        updatedAt: new Date()
      }
    });

    if (updated.count === 0) {
      redirect(`/submit?error=invalid_form&field=form&message=${encodeURIComponent("Нельзя редактировать эту заявку")}`);
    }
  } else {
    const rawAccessToken = crypto.randomBytes(24).toString("hex");
    const createdAccessTokenHash = crypto.createHash("sha256").update(rawAccessToken).digest("hex");

    const createdSubmission = await prisma.submission.create({
      data: {
        authorId: null,
        contactName: contactParsed.data.contactName,
        contactEmail: normalizedEmail,
        accessTokenHash: createdAccessTokenHash,
        payloadJson: parsed.data,
        submissionType: SubmissionType.create,
        targetEntityType: parsed.data.targetEntityType as EntityType,
        status: ModerationStatus.pending
      },
      select: { id: true }
    });

    const successParams = new URLSearchParams({
      success: "submitted",
      submissionId: createdSubmission.id,
      accessToken: rawAccessToken
    });
    redirect(`/submit?${successParams.toString()}`);
  }

  revalidatePath("/submission-status");
  revalidatePath("/admin");

  const successParams = new URLSearchParams({
    success: "submitted",
    submissionId: contactParsed.data.submissionId || "",
    accessToken: contactParsed.data.accessToken || ""
  });
  redirect(`/submit?${successParams.toString()}`);
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

    const payloadResult = submitSchema.safeParse(submission.payloadJson);
    if (!payloadResult.success) {
      throw new Error("Невалидный payload заявки, публикация невозможна.");
    }

    const payload = payloadResult.data;
    const slugSource = "title" in payload ? payload.title : payload.fullName;
    const slugBase = slugSource.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "");
    const slug = `${slugBase || "material"}-${Date.now()}`;

    const dataCommon = {
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date(),
      submittedById: submission.authorId
    };

    let createdEntityId: string | undefined;

    if (payload.targetEntityType === EntityType.Person) {
      const nameParts = payload.fullName.trim().split(/\s+/);
      const createdPerson = await tx.person.create({
        data: {
          ...dataCommon,
          slug,
          fullName: payload.fullName,
          firstName: nameParts[0] ?? "Неизвестно",
          lastName: nameParts.slice(1).join(" ") || "Неизвестно",
          shortDescription: payload.shortDescription || payload.biography.slice(0, 240),
          biography: payload.biography,
          birthDate: payload.birthDate,
          deathDate: payload.deathDate,
          faculty: payload.faculty,
          department: payload.department,
          photoUrl: payload.photoUrls[0] ?? null,
          photoUrls: payload.photoUrls
        }
      });

      createdEntityId = createdPerson.id;
    }

    if (payload.targetEntityType === EntityType.Story) {
      const createdStory = await tx.story.create({
        data: {
          ...dataCommon,
          slug,
          title: payload.title,
          storyType: payload.storyType,
          excerpt: payload.excerpt,
          content: payload.content,
          sourceInfo: payload.sourceInfo
        }
      });

      createdEntityId = createdStory.id;
    }

    if (createdEntityId) {
      await tx.submission.update({
        where: { id: submission.id },
        data: { targetEntityId: createdEntityId }
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/memory");
}
