import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = await prisma.person.findFirst({
    where: {
      slug,
      OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }]
    },
    include: { archiveMaterials: true, stories: true, chronicleEvents: true }
  });
  if (!person) notFound();
  return <article className="space-y-3"><h1 className="text-3xl font-semibold">{person.fullName}</h1><p>{person.biography}</p></article>;
}
