import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PhotoCarousel } from "@/components/photo-carousel";

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

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

  const photos = person.photoUrls.length > 0 ? person.photoUrls : person.photoUrl ? [person.photoUrl] : [];

  return (
    <article className="space-y-3 break-words">
      <h1 className="text-3xl font-semibold">{person.fullName}</h1>
      <div className="text-sm text-slate-600">
        <p>Дата рождения: {formatDate(person.birthDate) ?? "—"}</p>
        <p>Дата смерти: {formatDate(person.deathDate) ?? "—"}</p>
        <p>Опубликовано: {formatDate(person.publishedAt) ?? "—"}</p>
      </div>
      {photos.length > 0 ? <PhotoCarousel photos={photos} alt={person.fullName} /> : null}
      <p className="[overflow-wrap:anywhere]">{person.biography}</p>
    </article>
  );
}
