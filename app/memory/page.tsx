export const dynamic = "force-dynamic";

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
    where: {
      moderationStatus: ModerationStatus.approved,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { shortDescription: { contains: q, mode: "insensitive" } },
              { biography: { contains: q, mode: "insensitive" } },
              { faculty: { contains: q, mode: "insensitive" } },
              { department: { contains: q, mode: "insensitive" } },
              { participationPeriod: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { middleName: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { publishedAt: "desc" }
  });

  return (
    <div className="space-y-7">
      <section className="rounded-xl border border-borderWarm bg-gradient-to-b from-[#f8f1e5] to-[#f3e8d8] p-5 shadow-panel sm:p-6">
        <h1 className="text-3xl font-semibold text-[#3d2d1f]">Участники и истории</h1>
        <p className="mt-2 max-w-3xl text-[#5b4631]">
          Используйте поиск по имени, описанию, биографии, роду войск или периоду участия.
        </p>
        <div className="mt-4 rounded-xl border border-[#ccb18b] bg-[#fefcf4] p-3 sm:p-4">
          <SearchForm defaultValue={q ?? ""} placeholder="Поиск персон" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#dac9ac] pb-2">
          <h2 className="subsection-title text-[#4a3422]">Каталог участников</h2>
          <p className="text-sm text-[#78614a]">Найдено: {items.length}</p>
        </div>
        <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
      </section>
    </div>
  );
}
