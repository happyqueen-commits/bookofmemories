import { ModerationStatus } from "@prisma/client";
import { Card } from "@/components/card";
import { SearchForm } from "@/components/search-form";
import { prisma } from "@/lib/prisma";

export default async function StoriesPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q;
  const items = await prisma.story.findMany({ where: { moderationStatus: ModerationStatus.approved, ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) }, orderBy: { publishedAt: "desc" } });
  return <div><h1 className="mb-4 text-2xl font-semibold">Интервью и воспоминания</h1><SearchForm defaultValue={q ?? ""} placeholder="Поиск историй" /><div className="space-y-4">{items.map((i) => <Card key={i.id} title={i.title} text={i.excerpt} href={`/stories/${i.slug}`} />)}</div></div>;
}
