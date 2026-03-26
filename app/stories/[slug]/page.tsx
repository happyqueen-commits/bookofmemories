import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const item = await prisma.story.findFirst({ where: { slug: params.slug, moderationStatus: ModerationStatus.approved }, include: { persons: true } });
  if (!item) notFound();
  return <article className="space-y-3"><h1 className="text-3xl font-semibold">{item.title}</h1><p className="text-slate-700">{item.excerpt}</p><div>{item.content}</div></article>;
}
