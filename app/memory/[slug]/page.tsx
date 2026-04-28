export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PhotoCarousel } from "@/components/photo-carousel";
import { MetadataItem, PersonMetaList } from "@/components/person-meta-list";
import { getPersonImageAlt, resolvePersonImageUrl } from "@/lib/placeholders";

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
      deletedAt: null,
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

  const photos = person.photoUrls.map((photo) => photo.trim()).filter(Boolean);
  const primaryPhoto = person.photoUrl?.trim();
  const normalizedPhotos =
    photos.length > 0 ? photos : primaryPhoto ? [primaryPhoto] : [resolvePersonImageUrl(person.photoUrl)];
  const altText = getPersonImageAlt(person.fullName, normalizedPhotos[0]);

  return (
    <article className="mx-auto max-w-5xl break-words">
      <section className="rounded-2xl border border-[#cfbea0] bg-[#f9f4e9] p-5 shadow-panel md:p-7">
        <header className="border-b border-[#d7c7ab] pb-4 md:pb-5">
          <h1 className="text-3xl font-semibold tracking-tight text-[#362718] md:text-4xl">{person.fullName}</h1>
          <PersonMetaList className="mt-3 grid gap-1 text-sm text-[#6c5a45] sm:grid-cols-2">
            <MetadataItem label="Дата рождения" value={formatDate(person.birthDate)} />
            <MetadataItem label="Дата смерти" value={formatDate(person.deathDate)} />
            <MetadataItem label="Воинское звание" value={person.faculty} />
            <MetadataItem label="Род войск / направление службы" value={person.department} />
            <MetadataItem className="sm:col-span-2" label="Период участия" value={person.participationPeriod} />
            <MetadataItem className="sm:col-span-2" label="Опубликовано" value={formatDate(person.publishedAt)} />
          </PersonMetaList>
        </header>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(270px,340px)_minmax(0,1fr)] lg:items-start">
          <PhotoCarousel photos={normalizedPhotos} alt={altText} />
          <section className="rounded-xl border border-[#dccdb2] bg-[#fffdf8] p-4 md:p-5">
            <h2 className="text-base font-semibold tracking-wide text-[#4d3a24]">Описание</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-[#3f2f21] [overflow-wrap:anywhere]">{person.biography}</p>
          </section>
        </div>
      </section>
    </article>
  );
}
