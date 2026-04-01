import { prisma } from "@/lib/prisma";
import { ModerationStatus } from "@prisma/client";
import { SearchForm } from "@/components/search-form";
import { Card } from "@/components/card";

export default async function MemoryPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  const items = await prisma.person.findMany({
    where: {
      AND: [
        { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] },
        ...(q ? [{ fullName: { contains: q, mode: "insensitive" as const } }] : [])
      ]
    },
    orderBy: { publishedAt: "desc" }
  });
  return <div><h1 className="mb-4 text-2xl font-semibold">Книга памяти</h1><SearchForm defaultValue={q ?? ""} placeholder="Поиск персон" /><div className="grid gap-4 md:grid-cols-2">{items.map((i) => <Card key={i.id} title={i.fullName} text={i.shortDescription} href={`/memory/${i.slug}`} />)}</div></div>;
}
