import { Card } from "@/components/card";
import { SearchForm } from "@/components/search-form";
import { buildArchiveMaterialsWhere } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export default async function ArchivePage({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const { q, type } = searchParams;

  const items = await prisma.archiveMaterial.findMany({
    where: buildArchiveMaterialsWhere(q, type),
    orderBy: { publishedAt: "desc" }
  });

  return <div><h1 className="mb-4 text-2xl font-semibold">Архив</h1><SearchForm defaultValue={q ?? ""} placeholder="Поиск архивных материалов" /><div className="mb-4"><label className="text-sm">Фильтр по типу: {type ?? "все"}</label></div><div className="grid gap-4 md:grid-cols-2">{items.map((i) => <Card key={i.id} title={i.title} text={i.description} href={`/archive/${i.slug}`} />)}</div></div>;
}
