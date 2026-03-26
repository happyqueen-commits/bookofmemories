import { ModerationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getHomepageData() {
  const [featuredPersons, latestArchive, latestStories, latestChronicle, stats] = await Promise.all([
    prisma.person.findMany({ where: { moderationStatus: ModerationStatus.approved }, take: 3, orderBy: { publishedAt: "desc" } }),
    prisma.archiveMaterial.findMany({ where: { moderationStatus: ModerationStatus.approved }, take: 4, orderBy: { publishedAt: "desc" } }),
    prisma.story.findMany({ where: { moderationStatus: ModerationStatus.approved }, take: 3, orderBy: { publishedAt: "desc" } }),
    prisma.chronicleEvent.findMany({ where: { moderationStatus: ModerationStatus.approved }, take: 3, orderBy: { eventDate: "desc" } }),
    Promise.all([
      prisma.person.count({ where: { moderationStatus: ModerationStatus.approved } }),
      prisma.archiveMaterial.count({ where: { moderationStatus: ModerationStatus.approved } }),
      prisma.story.count({ where: { moderationStatus: ModerationStatus.approved } }),
      prisma.chronicleEvent.count({ where: { moderationStatus: ModerationStatus.approved } })
    ])
  ]);

  return { featuredPersons, latestArchive, latestStories, latestChronicle, stats };
}

export async function getPublicLists(query?: string) {
  const search = query?.trim();
  const baseWhere = (field: string): Prisma.StringFilter | undefined => search ? { contains: search, mode: "insensitive" } : undefined;

  const [persons, archive, stories, chronicle] = await Promise.all([
    prisma.person.findMany({ where: { moderationStatus: ModerationStatus.approved, OR: search ? [{ fullName: baseWhere("fullName") }] : undefined }, orderBy: { publishedAt: "desc" } }),
    prisma.archiveMaterial.findMany({ where: { moderationStatus: ModerationStatus.approved, OR: search ? [{ title: baseWhere("title") }, { description: baseWhere("description") }] : undefined }, orderBy: { publishedAt: "desc" } }),
    prisma.story.findMany({ where: { moderationStatus: ModerationStatus.approved, OR: search ? [{ title: baseWhere("title") }, { excerpt: baseWhere("excerpt") }] : undefined }, orderBy: { publishedAt: "desc" } }),
    prisma.chronicleEvent.findMany({ where: { moderationStatus: ModerationStatus.approved, OR: search ? [{ title: baseWhere("title") }, { summary: baseWhere("summary") }] : undefined }, orderBy: { eventDate: "desc" } })
  ]);

  return { persons, archive, stories, chronicle };
}
