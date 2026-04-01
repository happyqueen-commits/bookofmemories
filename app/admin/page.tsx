import { Role } from "@prisma/client";
import { moderateSubmissionAction } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { getEntityTypeLabel } from "@/lib/entity-labels";
import { prisma } from "@/lib/prisma";

const payloadFieldLabels: Record<string, string> = {
  fullName: "ФИО",
  biography: "Биография",
  shortDescription: "Краткое описание",
  birthDate: "Дата рождения",
  deathDate: "Дата смерти",
  faculty: "Факультет",
  department: "Кафедра",
  title: "Заголовок",
  summary: "Краткая сводка",
  content: "Подробное описание",
  eventDate: "Дата события",
  coverImageUrl: "Обложка (URL)"
};

const moderationStatuses = [
  { value: "approved", label: "✅ Принято" },
  { value: "needs_revision", label: "✏️ Нужны правки" },
  { value: "rejected", label: "⛔ Отклонено" }
] as const;

function formatPayloadValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN)) {
    return <div><h1 className="text-2xl font-semibold">Админ-панель</h1><p className="mt-2">Доступ только для MODERATOR/ADMIN.</p></div>;
  }

  const submissions = await prisma.submission.findMany({ where: { status: { in: ["pending", "needs_revision", "approved"] } }, include: { author: true }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Панель модерации</h1>
      <div className="space-y-4">
        {submissions.map((s) => (
          <article key={s.id} className="rounded border border-slate-300 bg-white p-4">
            <p className="text-sm text-slate-600">Контакт автора: {s.contactName} ({s.contactEmail})</p>
            {s.author ? <p className="text-xs text-slate-500">Связанная учетная запись: {s.author.name} ({s.author.email})</p> : null}
            <p className="font-medium">
              {getEntityTypeLabel(s.targetEntityType)}
              {s.targetEntityId ? <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">уже опубликовано</span> : null}
            </p>
            <div className="mt-3 space-y-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
              {Object.entries((s.payloadJson as Record<string, unknown>) ?? {}).map(([field, value]) => (
                <div key={field}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {payloadFieldLabels[field] ?? field}
                  </p>
                  <p className="whitespace-pre-wrap text-slate-900">{formatPayloadValue(value)}</p>
                </div>
              ))}
            </div>
            <form action={moderateSubmissionAction} className="mt-3 grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="submissionId" value={s.id} />
              <select name="status" className="rounded border border-slate-300 px-2 py-1">
                {moderationStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <input name="moderatorComment" placeholder="Комментарий" className="rounded border border-slate-300 px-2 py-1 sm:col-span-2" />
              <button className="rounded bg-slate-800 px-3 py-1 text-white">Применить</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
