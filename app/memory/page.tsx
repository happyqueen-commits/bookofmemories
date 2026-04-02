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
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Книга памяти</h1>
      <SearchForm defaultValue={q ?? ""} placeholder="Поиск персон" />
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
