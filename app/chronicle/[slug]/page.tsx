import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function ChronicleItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug).trim();

  const item = await prisma.chronicleEvent.findFirst({
    where: {
      moderationStatus: ModerationStatus.approved,
      slug: {
        equals: normalizedSlug,
        mode: "insensitive"
      }
    },
    include: {
      persons: true
    }
  });

  if (!item) notFound();

  return (
    <article className="space-y-3">
      <h1 className="text-3xl font-semibold">{item.title}</h1>
      <p>{item.summary}</p>
      <p>{item.content}</p>
      <p className="text-sm text-slate-600">Дата: {item.eventDate.toLocaleDateString("ru-RU")}</p>
    </article>
  );
}
