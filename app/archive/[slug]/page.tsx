import { notFound } from "next/navigation";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function ArchiveItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug).trim();

  const item = await prisma.archiveMaterial.findFirst({
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
      <p>{item.description}</p>
      <p className="text-sm text-slate-600">Источник: {item.sourceInfo}</p>
      {item.fileUrl && (
        <a className="text-blue-700 underline" href={item.fileUrl}>
          Ссылка на файл
        </a>
      )}
    </article>
  );
}
