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

const splitTags = z.preprocess((value) => {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}, z.array(z.string().min(1)).min(1));

const personSchema = z.object({
  targetEntityType: z.literal("Person"),
  fullName: z.string().trim().min(2),
  biography: z.string().trim().min(10),
  shortDescription: z.string().trim().min(3).optional().or(z.literal("")),
  birthDate: optionalDate,
  deathDate: optionalDate,
  faculty: optionalTrimmedString,
  department: optionalTrimmedString
});

const archiveMaterialSchema = z.object({
  targetEntityType: z.literal("ArchiveMaterial"),
  title: z.string().trim().min(2),
  description: z.string().trim().min(3),
  materialType: z.string().trim().min(2),
  sourceInfo: z.string().trim().min(2),
  eventDate: optionalDate,
  tags: splitTags,
  fileUrl: optionalUrl,
  previewImageUrl: optionalUrl
});

const storySchema = z.object({
  targetEntityType: z.literal("Story"),
  title: z.string().trim().min(2),
  storyType: z.string().trim().min(2),
  excerpt: z.string().trim().min(3),
  content: z.string().trim().min(10),
  sourceInfo: optionalTrimmedString
});

const chronicleEventSchema = z.object({
  targetEntityType: z.literal("ChronicleEvent"),
  title: z.string().trim().min(2),
  summary: z.string().trim().min(3),
  content: z.string().trim().min(10),
  eventDate: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? new Date(trimmed) : undefined;
  }, z.date()),
  coverImageUrl: optionalUrl
});

const submitSchema = z.discriminatedUnion("targetEntityType", [
  personSchema,
  archiveMaterialSchema,
  storySchema,
  chronicleEventSchema
]).superRefine((data, ctx) => {
  if (data.targetEntityType === "ArchiveMaterial" && !data.fileUrl && !data.previewImageUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Нужно заполнить fileUrl или previewImageUrl",
      path: ["fileUrl"]
    });
  }
});

const moderateSchema = z.object({
  submissionId: z.string().cuid(),
  status: z.enum(["approved", "needs_revision", "rejected"]),
  moderatorComment: z.string().max(2000).optional().or(z.literal(""))
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа."),
    email: z.string().trim().email("Введите корректный email."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Подтвердите пароль.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают.",
    path: ["confirmPassword"]
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
  formData: FormData
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      errors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0]
      },
      formError: "Проверьте корректность заполнения формы."
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return {
      status: "error",
      errors: { email: "Пользователь с таким email уже существует." },
      formError: "Email уже занят."
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: Role.AUTHOR
    }
  });

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/account"
  });

  return {
    status: "success",
    successMessage: "Регистрация прошла успешно. Войдите в аккаунт."
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
  const session = await auth();
  if (!session?.user?.id) redirect("/account");

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
    eventDate: formData.get("eventDate"),
    tags: formData.get("tags"),
    fileUrl: formData.get("fileUrl"),
    previewImageUrl: formData.get("previewImageUrl"),
    storyType: formData.get("storyType"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverImageUrl: formData.get("coverImageUrl")
  });

  if (!parsed.success) {
    redirect("/submit?error=invalid_form");
  }

  await prisma.submission.create({
    data: {
      authorId: session.user.id,
      payloadJson: parsed.data,
      submissionType: SubmissionType.create,
      targetEntityType: parsed.data.targetEntityType as EntityType,
      status: ModerationStatus.pending
    }
  });

  revalidatePath("/account");
  revalidatePath("/admin");
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
          department: payload.department
        }
      });

      createdEntityId = createdPerson.id;
    }

    if (payload.targetEntityType === EntityType.ArchiveMaterial) {
      const createdArchiveMaterial = await tx.archiveMaterial.create({
        data: {
          ...dataCommon,
          slug,
          title: payload.title,
          description: payload.description,
          materialType: payload.materialType,
          sourceInfo: payload.sourceInfo,
          eventDate: payload.eventDate,
          tags: payload.tags,
          fileUrl: payload.fileUrl,
          previewImageUrl: payload.previewImageUrl
        }
      });

      createdEntityId = createdArchiveMaterial.id;
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

    if (payload.targetEntityType === EntityType.ChronicleEvent) {
      const createdChronicleEvent = await tx.chronicleEvent.create({
        data: {
          ...dataCommon,
          slug,
          title: payload.title,
          summary: payload.summary,
          content: payload.content,
          eventDate: payload.eventDate,
          coverImageUrl: payload.coverImageUrl
        }
      });

      createdEntityId = createdChronicleEvent.id;
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
  revalidatePath("/archive");
  revalidatePath("/stories");
  revalidatePath("/chronicle");
}
