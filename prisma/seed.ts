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
      slug: "aleksei-smirnov",
      fullName: "Алексей Смирнов",
      firstName: "Алексей",
      lastName: "Смирнов",
      shortDescription: "Участник СВО, служил в инженерных войсках.",
      biography: "Родился в Туле, занимался спортом и волонтерством. В 2022 году отправился в зону СВО, где проявил мужество и верность товарищам.",
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date("2025-01-15T10:00:00.000Z")
    }
  });

  await prisma.story.create({
    data: {
      slug: "memory-about-aleksei-smirnov",
      title: "Память об Алексее Смирнове",
      storyType: "Воспоминание",
      excerpt: "Близкие вспоминают его ответственность и доброту.",
      content: "Алексей поддерживал семью и сослуживцев, всегда приходил на помощь и оставил светлую память.",
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date("2025-01-20T10:00:00.000Z"),
      persons: { connect: [{ id: publishedPerson.id }] }
    }
  });

  await prisma.archiveMaterial.create({
    data: {
      slug: "smirnov-award-order-copy",
      title: "Копия приказа о награждении",
      description: "Архивный документ, подтверждающий награждение за мужество.",
      materialType: "Документ",
      tags: ["архив", "награда"],
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
          biography: "Родилась в Воронеже, в 2023 году служила в медицинском подразделении.",
          shortDescription: "Служба в медицинском подразделении",
          faculty: "младший сержант",
          department: "медицинская служба",
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
          biography: "Служил в мотострелковом подразделении, отмечен командованием за дисциплину.",
          shortDescription: "Участник СВО, мотострелковые войска",
          faculty: "сержант",
          department: "мотострелковые войска",
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
