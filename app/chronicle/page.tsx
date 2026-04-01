import { ModerationStatus } from "@prisma/client";
import { Card } from "@/components/card";
import { SearchForm } from "@/components/search-form";
import { prisma } from "@/lib/prisma";

export default async function ChroniclePage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q;
  const items = await prisma.chronicleEvent.findMany({
    where: {
      AND: [
        { OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }] },
        ...(q ? [{ title: { contains: q, mode: "insensitive" as const } }] : [])
      ]
    },
    orderBy: { eventDate: "desc" }
  });
  return <div><h1 className="mb-4 text-2xl font-semibold">Хроника</h1><SearchForm defaultValue={q ?? ""} placeholder="Поиск событий" /><div className="space-y-4">{items.map((i) => <Card key={i.id} title={i.title} text={i.summary} href={`/chronicle/${i.slug}`} />)}</div></div>;
}
