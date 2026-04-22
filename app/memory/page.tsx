import { prisma } from "@/lib/prisma";
import { ModerationStatus } from "@prisma/client";
import { SearchForm } from "@/components/search-form";
import { Card, formatLifespan } from "@/components/card";

function getBiographyExcerpt(biography: string, fallback: string) {
  const firstLine = biography
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine) return firstLine;
  return fallback;
}

export default async function MemoryPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  const items = await prisma.person.findMany({
    where: { moderationStatus: ModerationStatus.approved, ...(q ? { fullName: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: { publishedAt: "desc" }
  });

  return (
    <div className="space-y-5">
      <section className="rounded-sm border-2 border-borderWarm bg-section-cream p-5 shadow-panel">
        <h1 className="text-3xl font-semibold text-[#3d2d1f]">Участники и истории</h1>
        <p className="mt-2 text-[#5b4631]">Используйте поиск по фамилии и имени, чтобы найти нужную карточку в книге участников.</p>
        <div className="mt-4 rounded-sm border border-[#ccb18b] bg-[#fefbf1] p-4">
          <SearchForm defaultValue={q ?? ""} placeholder="Поиск персон" />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card
            key={item.id}
            title={item.fullName}
            subtitle={formatLifespan(item.birthDate, item.deathDate)}
            imageUrl={item.photoUrl}
            text={getBiographyExcerpt(item.biography, item.shortDescription)}
            href={`/memory/${item.slug}`}
          />
        ))}
      </div>
    </div>
  );
}
