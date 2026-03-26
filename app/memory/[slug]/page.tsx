import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function PersonPage({ params }: { params: { slug: string } }) {
  const person = await prisma.person.findFirst({ where: { slug: params.slug, moderationStatus: ModerationStatus.approved }, include: { archiveMaterials: true, stories: true, chronicleEvents: true } });
  if (!person) notFound();
  return <article className="space-y-3"><h1 className="text-3xl font-semibold">{person.fullName}</h1><p>{person.biography}</p></article>;
}
