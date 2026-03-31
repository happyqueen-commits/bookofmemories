"use server";

import { EntityType, ModerationStatus, Role, SubmissionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const submitSchema = z.object({
  targetEntityType: z.enum(["Person", "ArchiveMaterial", "Story", "ChronicleEvent"]),
  title: z.string().trim().min(2),
  description: z.string().trim().min(3)
});

const moderateSchema = z.object({
  submissionId: z.string().cuid(),
  status: z.enum(["approved", "needs_revision", "rejected"]),
  moderatorComment: z.string().max(2000).optional().or(z.literal(""))
});

export async function loginAction(formData: FormData) {
  await signIn("credentials", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    redirectTo: "/account"
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function submitMaterialAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account");

  const parsed = submitSchema.safeParse({
    targetEntityType: formData.get("targetEntityType"),
    title: formData.get("title"),
    description: formData.get("description")
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

    const payload = submission.payloadJson as { title?: string; description?: string };
    const slug = (payload.title ?? "material").toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "");
    const dataCommon = {
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date(),
      submittedById: submission.authorId
    };

    let createdEntityId: string | undefined;

    if (submission.targetEntityType === EntityType.Person) {
      const createdPerson = await tx.person.create({
        data: {
          ...dataCommon,
          slug: `${slug}-${Date.now()}`,
          fullName: payload.title ?? "Безымянный",
          firstName: payload.title?.split(" ")[0] ?? "Имя",
          lastName: payload.title?.split(" ").slice(1).join(" ") || "Фамилия",
          shortDescription: payload.description ?? "",
          biography: payload.description ?? ""
        }
      });

      createdEntityId = createdPerson.id;
    }

    if (submission.targetEntityType === EntityType.ArchiveMaterial) {
      const createdArchiveMaterial = await tx.archiveMaterial.create({
        data: {
          ...dataCommon,
          slug: `${slug}-${Date.now()}`,
          title: payload.title ?? "Материал",
          description: payload.description ?? "",
          materialType: "Документ",
          tags: ["память"]
        }
      });

      createdEntityId = createdArchiveMaterial.id;
    }

    if (submission.targetEntityType === EntityType.Story) {
      const createdStory = await tx.story.create({
        data: {
          ...dataCommon,
          slug: `${slug}-${Date.now()}`,
          title: payload.title ?? "История",
          storyType: "Интервью",
          excerpt: payload.description ?? "",
          content: payload.description ?? ""
        }
      });

      createdEntityId = createdStory.id;
    }

    if (submission.targetEntityType === EntityType.ChronicleEvent) {
      const createdChronicleEvent = await tx.chronicleEvent.create({
        data: {
          ...dataCommon,
          slug: `${slug}-${Date.now()}`,
          title: payload.title ?? "Событие",
          summary: payload.description ?? "",
          content: payload.description ?? "",
          eventDate: new Date()
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
