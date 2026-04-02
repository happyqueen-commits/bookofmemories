import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug).trim();

  const person = await prisma.person.findFirst({
    where: {
      moderationStatus: ModerationStatus.approved,
      slug: {
        equals: normalizedSlug,
        mode: "insensitive"
      }
    },
    include: {
      archiveMaterials: true,
      stories: true,
      chronicleEvents: true
    }
  });

  if (!person) notFound();

  return (
    <article className="space-y-3 break-words">
      <h1 className="text-3xl font-semibold">{person.fullName}</h1>
      <p className="[overflow-wrap:anywhere]">{person.biography}</p>
    </article>
  );
}
