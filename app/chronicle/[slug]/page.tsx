import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function ChronicleItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await prisma.chronicleEvent.findFirst({
    where: {
      slug,
      OR: [{ moderationStatus: ModerationStatus.approved }, { publishedAt: { not: null } }]
    },
    include: { persons: true }
  });
  if (!item) notFound();
  return <article className="space-y-3"><h1 className="text-3xl font-semibold">{item.title}</h1><p>{item.summary}</p><div>{item.content}</div></article>;
}
