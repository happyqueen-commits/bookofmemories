import { ModerationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function buildSearchFilter(search?: string): Prisma.StringFilter | undefined {
  const query = search?.trim();

  return query ? { contains: query, mode: "insensitive" } : undefined;
}

export function buildArchiveMaterialsWhere(query?: string, type?: string): Prisma.ArchiveMaterialWhereInput {
  const searchFilter = buildSearchFilter(query);

  return {
    moderationStatus: ModerationStatus.approved,
    ...(searchFilter
      ? {
          OR: [{ title: searchFilter }, { description: searchFilter }]
        }
      : {}),
    ...(type ? { materialType: type } : {})
  };
}

export async function getHomepageData() {
  const [featuredPersons, latestChronicle, stats] = await Promise.all([
    prisma.person.findMany({ where: { moderationStatus: ModerationStatus.approved }, take: 3, orderBy: { publishedAt: "desc" } }),
    prisma.chronicleEvent.findMany({ where: { moderationStatus: ModerationStatus.approved }, take: 3, orderBy: { eventDate: "desc" } }),
    Promise.all([
      prisma.person.count({ where: { moderationStatus: ModerationStatus.approved } }),
      prisma.chronicleEvent.count({ where: { moderationStatus: ModerationStatus.approved } })
    ])
  ]);

  return { featuredPersons, latestChronicle, stats };
}

export async function getPublicLists(query?: string) {
  const search = query?.trim();
  const searchFilter = buildSearchFilter(search);

  const [persons, archive, stories, chronicle] = await Promise.all([
    prisma.person.findMany({ where: { moderationStatus: ModerationStatus.approved, OR: searchFilter ? [{ fullName: searchFilter }] : undefined }, orderBy: { publishedAt: "desc" } }),
    prisma.archiveMaterial.findMany({ where: buildArchiveMaterialsWhere(search), orderBy: { publishedAt: "desc" } }),
    prisma.story.findMany({ where: { moderationStatus: ModerationStatus.approved, OR: searchFilter ? [{ title: searchFilter }, { excerpt: searchFilter }] : undefined }, orderBy: { publishedAt: "desc" } }),
    prisma.chronicleEvent.findMany({ where: { moderationStatus: ModerationStatus.approved, OR: searchFilter ? [{ title: searchFilter }, { summary: searchFilter }] : undefined }, orderBy: { eventDate: "desc" } })
  ]);

  return { persons, archive, stories, chronicle };
}
