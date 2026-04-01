import bcrypt from "bcryptjs";
import { ModerationStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.submission.deleteMany();
  await prisma.archiveMaterial.deleteMany();
  await prisma.story.deleteMany();
  await prisma.chronicleEvent.deleteMany();
  await prisma.person.deleteMany();
  await prisma.user.deleteMany();

  const [authorPassword, moderatorPassword, adminPassword] = await Promise.all([
    bcrypt.hash("author123", 10),
    bcrypt.hash("moderator123", 10),
    bcrypt.hash("admin123", 10)
  ]);

  const author = await prisma.user.create({ data: { name: "Автор Тест", email: "author@example.com", passwordHash: authorPassword, role: Role.AUTHOR } });
  const moderator = await prisma.user.create({ data: { name: "Модератор Тест", email: "moderator@example.com", passwordHash: moderatorPassword, role: Role.MODERATOR } });
  await prisma.user.create({ data: { name: "Админ Тест", email: "admin@example.com", passwordHash: adminPassword, role: Role.ADMIN } });

  const person = await prisma.person.create({
    data: {
      slug: "ivan-ivanov",
      fullName: "Иван Иванов",
      firstName: "Иван",
      lastName: "Иванов",
      shortDescription: "Выпускник университета, участник событий периода.",
      biography: "Биографическая справка для MVP.",
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date(),
      submittedById: author.id
    }
  });

  await prisma.archiveMaterial.create({
    data: {
      slug: "archive-letter-1",
      title: "Письмо из архива №1",
      description: "Оцифрованный документ из семейного архива.",
      materialType: "Письмо",
      tags: ["архив", "документ"],
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date(),
      submittedById: author.id,
      persons: { connect: [{ id: person.id }] }
    }
  });

  await prisma.story.create({
    data: {
      slug: "story-interview-1",
      title: "Интервью с выпускником",
      storyType: "Интервью",
      excerpt: "Короткий фрагмент воспоминаний.",
      content: "Полный текст интервью для демонстрации MVP.",
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date(),
      submittedById: author.id,
      persons: { connect: [{ id: person.id }] }
    }
  });

  await prisma.chronicleEvent.create({
    data: {
      slug: "chronicle-event-1",
      title: "Событие хроники №1",
      summary: "Краткое описание события.",
      content: "Подробности события хроники.",
      eventDate: new Date("2023-09-01"),
      moderationStatus: ModerationStatus.approved,
      publishedAt: new Date(),
      submittedById: author.id,
      persons: { connect: [{ id: person.id }] }
    }
  });

  await prisma.submission.create({
    data: {
      submissionType: "create",
      targetEntityType: "Story",
      contactName: author.name,
      contactEmail: author.email,
      payloadJson: { title: "Черновик материала", description: "Нужна доработка доказательной базы" },
      status: ModerationStatus.needs_revision,
      authorId: author.id,
      moderatorId: moderator.id,
      moderatorComment: "Добавьте источник и дату записи интервью."
    }
  });
}

main().finally(() => prisma.$disconnect());
