import bcrypt from "bcryptjs";
import { ModerationStatus, Role, SubmissionType } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.$transaction([
    prisma.publicRateLimit.deleteMany(),
    prisma.loginAttempt.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.archiveMaterial.deleteMany(),
    prisma.story.deleteMany(),
    prisma.chronicleEvent.deleteMany(),
    prisma.person.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const [moderatorPassword, adminPassword] = await Promise.all([
    bcrypt.hash("moderator123", 10),
    bcrypt.hash("admin123", 10)
  ]);

  const moderator = await prisma.user.create({
    data: {
      name: "Модератор Демо",
      email: "moderator@book.local",
      passwordHash: moderatorPassword,
      role: Role.MODERATOR
    }
  });

  await prisma.user.create({
    data: {
      name: "Админ Демо",
      email: "admin@book.local",
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  const publishedPerson = await prisma.person.create({
    data: {
      slug: "elena-smirnova",
      fullName: "Елена Смирнова",
      firstName: "Елена",
      lastName: "Смирнова",
      shortDescription: "Доцент кафедры вычислительной математики.",
      biography: "Работала в университете более 30 лет, развивала учебные программы и вела научные проекты.",
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date("2025-01-15T10:00:00.000Z")
    }
  });

  await prisma.story.create({
    data: {
      slug: "memory-about-elena-smirnova",
      title: "Память о Елене Смирновой",
      storyType: "Воспоминание",
      excerpt: "Коллеги вспоминают совместную работу и человеческую поддержку.",
      content: "Елена Александровна была наставником для молодых преподавателей и активным участником кафедральной жизни.",
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date("2025-01-20T10:00:00.000Z"),
      persons: { connect: [{ id: publishedPerson.id }] }
    }
  });

  await prisma.archiveMaterial.create({
    data: {
      slug: "smirnova-archive-lecture-notes",
      title: "Конспекты лекций Е. А. Смирновой",
      description: "Оцифрованные материалы из архивного фонда кафедры.",
      materialType: "Документ",
      tags: ["архив", "лекции"],
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date("2025-01-18T10:00:00.000Z"),
      persons: { connect: [{ id: publishedPerson.id }] }
    }
  });

  await prisma.submission.createMany({
    data: [
      {
        submissionType: SubmissionType.create,
        targetEntityType: "Person",
        payloadJson: {
          targetEntityType: "Person",
          fullName: "Марина Воронцова",
          biography: "Кандидат наук, преподаватель истории университета.",
          shortDescription: "Преподаватель истории",
          faculty: "Исторический факультет",
          department: "Кафедра отечественной истории",
          photoUrls: []
        },
        status: ModerationStatus.pending,
        contactName: "Мария Сергеева",
        contactEmail: "maria@example.com"
      },
      {
        submissionType: SubmissionType.create,
        targetEntityType: "Person",
        payloadJson: {
          targetEntityType: "Person",
          fullName: "Павел Козлов",
          biography: "Бывший заведующий лабораторией, автор методических работ.",
          shortDescription: "Заведующий лабораторией",
          faculty: "Факультет приборостроения",
          department: "Лаборатория измерительных систем",
          photoUrls: []
        },
        status: ModerationStatus.needs_revision,
        moderatorComment: "Добавьте, пожалуйста, ссылку на подтверждающий источник.",
        moderatorId: moderator.id,
        contactName: "Ольга Крылова",
        contactEmail: "olga@example.com"
      }
    ]
  });

  console.log("Seed completed: database cleared and demo records created.");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
