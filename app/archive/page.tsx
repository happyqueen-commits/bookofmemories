import Link from "next/link";
import { ModerationStatus } from "@prisma/client";
import { Card } from "@/components/card";
import { SearchForm } from "@/components/search-form";
import { buildArchiveMaterialsWhere } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export default async function ArchivePage({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const { q, type } = searchParams;

  const [items, materialTypes] = await Promise.all([
    prisma.archiveMaterial.findMany({
      where: buildArchiveMaterialsWhere(q, type),
      orderBy: { publishedAt: "desc" }
    }),
    prisma.archiveMaterial.findMany({
      where: { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] },
      distinct: ["materialType"],
      select: { materialType: true },
      orderBy: { materialType: "asc" }
    })
  ]);

  const availableTypes = materialTypes
    .map((item) => item.materialType.trim())
    .filter(Boolean);

  const resetHref = q?.trim() ? `/archive?q=${encodeURIComponent(q.trim())}` : "/archive";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Архив</h1>
      <SearchForm defaultValue={q ?? ""} placeholder="Поиск архивных материалов" />

      <form method="get" className="mb-4 rounded border border-slate-200 p-4">
        {q ? <input type="hidden" name="q" value={q} /> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-56 flex-1">
            <label htmlFor="archive-type" className="mb-1 block text-sm font-medium text-slate-800">
              Тип материала
            </label>
            <p id="archive-type-hint" className="mb-1 text-xs text-slate-600">
              Выберите тип материала, чтобы сузить результаты поиска.
            </p>
            <select
              id="archive-type"
              name="type"
              defaultValue={type ?? ""}
              aria-describedby="archive-type-hint"
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
            >
              <option value="">Все типы</option>
              {availableTypes.map((materialType) => (
                <option key={materialType} value={materialType}>
                  {materialType}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-slate-800 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
            >
              Применить
            </button>
            <Link
              href={resetHref}
              className="rounded border border-slate-400 px-4 py-2 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
            >
              Сбросить
            </Link>
          </div>
        </div>
      </form>

      {type ? (
        <div className="mb-4">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            Активный фильтр: {type}
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((i) => (
          <Card key={i.id} title={i.title} text={i.description} href={`/archive/${i.slug}`} />
        ))}
      </div>
    </div>
  );
}
