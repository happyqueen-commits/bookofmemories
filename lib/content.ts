import { ModerationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function buildSearchFilter(search?: string): Prisma.StringFilter | undefined {
  const query = search?.trim();

  return query ? { contains: query, mode: "insensitive" } : undefined;
}

export function buildArchiveMaterialsWhere(query?: string, type?: string): Prisma.ArchiveMaterialWhereInput {
  const searchFilter = buildSearchFilter(query);

  return {
    AND: [
      { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] },
      ...(searchFilter ? [{ OR: [{ title: searchFilter }, { description: searchFilter }] }] : [])
    ],
    ...(type ? { materialType: type } : {})
  };
}

export async function getHomepageData() {
  const [featuredPersons, latestArchive, latestChronicle, stats] = await Promise.all([
    prisma.person.findMany({
      where: { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] },
      take: 3,
      orderBy: { publishedAt: "desc" }
    }),
    prisma.archiveMaterial.findMany({ where: buildArchiveMaterialsWhere(), take: 4, orderBy: { publishedAt: "desc" } }),
    prisma.chronicleEvent.findMany({
      where: { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] },
      take: 3,
      orderBy: { eventDate: "desc" }
    }),
    Promise.all([
      prisma.person.count({ where: { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] } }),
      prisma.archiveMaterial.count({ where: buildArchiveMaterialsWhere() }),
      prisma.chronicleEvent.count({ where: { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] } })
    ])
  ]);

  return { featuredPersons, latestArchive, latestChronicle, stats };
}

export async function getPublicLists(query?: string) {
  const search = query?.trim();
  const searchFilter = buildSearchFilter(search);

  const [persons, archive, stories, chronicle] = await Promise.all([
    prisma.person.findMany({
      where: {
        AND: [
          { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] },
          ...(searchFilter ? [{ OR: [{ fullName: searchFilter }] }] : [])
        ]
      },
      orderBy: { publishedAt: "desc" }
    }),
    prisma.archiveMaterial.findMany({ where: buildArchiveMaterialsWhere(search), orderBy: { publishedAt: "desc" } }),
    prisma.story.findMany({
      where: {
        OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }],
        ...(searchFilter ? { AND: [{ OR: [{ title: searchFilter }, { excerpt: searchFilter }] }] } : {})
      },
      orderBy: { publishedAt: "desc" }
    }),
    prisma.chronicleEvent.findMany({
      where: {
        OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }],
        ...(searchFilter ? { AND: [{ OR: [{ title: searchFilter }, { summary: searchFilter }] }] } : {})
      },
      orderBy: { eventDate: "desc" }
    })
  ]);

  return { persons, archive, stories, chronicle };
}
