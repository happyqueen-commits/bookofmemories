export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModerationStatus, Role } from "@prisma/client";
import { moderateSubmissionAction } from "@/lib/actions";
import { AdminArchiveToggle } from "@/components/admin-archive-toggle";
import { auth } from "@/lib/auth";
import { getEntityTypeLabel } from "@/lib/entity-labels";
import { prisma } from "@/lib/prisma";

const payloadFieldLabels: Record<string, string> = {
  fullName: "ФИО",
  biography: "Биография",
  shortDescription: "Краткое описание",
  birthDate: "Дата рождения",
  deathDate: "Дата смерти",
  militaryRank: "Воинское звание",
  serviceBranch: "Род войск / направление службы",
  participationPeriod: "Период участия",
  faculty: "Воинское звание",
  department: "Род войск / направление службы",
  photoUrls: "Фото"
};

const moderationStatuses = [
  { value: "approved", label: "✅ Принять" },
  { value: "needs_revision", label: "✏️ Нужны правки" },
  { value: "rejected", label: "⛔ Отклонить" }
] as const;

const statusBadge: Record<ModerationStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  needs_revision: "bg-blue-100 text-blue-900 border-blue-200",
  approved: "bg-emerald-100 text-emerald-900 border-emerald-200",
  rejected: "bg-rose-100 text-rose-900 border-rose-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200"
};

function formatPayloadValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join("\n") : "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function parseStatus(status?: string): ModerationStatus | undefined {
  if (!status) return undefined;
  if (["pending", "needs_revision", "approved", "rejected"].includes(status)) {
    return status as ModerationStatus;
  }
  return undefined;
}

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; personUpdated?: string; personArchived?: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN)) {
    return <div><h1 className="text-2xl font-semibold">Панель модерации</h1><p className="mt-2">Доступ разрешён только сотрудникам редакции.</p></div>;
  }

  const params = (await searchParams) ?? {};
  const filterStatus = parseStatus(params.status);

  const [submissions, persons] = await Promise.all([
    prisma.submission.findMany({
      where: {
        targetEntityType: "Person",
        ...(filterStatus ? { status: filterStatus } : { status: { in: ["pending", "needs_revision", "approved", "rejected"] } })
      },
      include: { author: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.person.findMany({
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return (
    <div className="container-lg space-y-6 md:space-y-7">
      {(params.personUpdated === "1" || params.personArchived === "1" || params.personArchived === "0") && (
        <p className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {params.personUpdated === "1" ? "Карточка успешно обновлена." : null}
          {params.personArchived === "1" ? " Карточка скрыта из публичного раздела." : null}
          {params.personArchived === "0" ? " Карточка снова опубликована." : null}
        </p>
      )}

      <div>
        <h1 className="text-2xl font-semibold">Панель модерации</h1>
        <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Проверяйте новые заявки, а опубликованные карточки редактируйте или скрывайте в блоке управления ниже.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Заявки на модерацию</h2>
        <form className="flex items-end gap-2 rounded border border-slate-200 bg-white p-3" method="get">
          <label className="text-sm">
            Фильтр по статусу
            <select defaultValue={filterStatus ?? ""} name="status" className="ml-2 rounded border border-slate-300 px-2 py-1">
              <option value="">Все</option>
              <option value="pending">На рассмотрении</option>
              <option value="needs_revision">Нужна доработка</option>
              <option value="approved">Одобрено</option>
              <option value="rejected">Отклонено</option>
            </select>
          </label>
          <button className="rounded border border-slate-300 px-3 py-1 text-sm">Применить</button>
        </form>

        <div className="space-y-4">
          {submissions.map((s) => (
            <article key={s.id} className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <p className="font-medium">{getEntityTypeLabel(s.targetEntityType)}</p>
                <span className={`rounded border px-2 py-0.5 text-xs font-medium ${statusBadge[s.status]}`}>{s.status}</span>
              </div>

              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p>Контакт автора: <strong>{s.contactName}</strong> ({s.contactEmail})</p>
                {s.author ? <p className="text-xs text-slate-500">Связанная учетная запись: {s.author.name} ({s.author.email})</p> : null}
                <p className="text-xs text-slate-500">ID заявки: {s.id}</p>
              </div>

              <div className="mt-3 grid gap-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2">
                {Object.entries((s.payloadJson as Record<string, unknown>) ?? {}).map(([field, value]) => (
                  <div key={field}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{payloadFieldLabels[field] ?? field}</p>
                    <p className="whitespace-pre-wrap break-words text-slate-900">{formatPayloadValue(value)}</p>
                  </div>
                ))}
              </div>

              <form action={moderateSubmissionAction} className="mt-3 grid gap-2 sm:grid-cols-4">
                <input type="hidden" name="submissionId" value={s.id} />
                <select name="status" className="rounded border border-slate-300 px-2 py-1">
                  {moderationStatuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <input name="moderatorComment" placeholder="Комментарий модератора" className="rounded border border-slate-300 px-2 py-1 sm:col-span-2" />
                <button className="rounded bg-slate-800 px-3 py-1 text-white">Сохранить</button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Управление карточками участников</h2>
        <div className="space-y-3">
          {persons.map((person) => {
            const isArchived = Boolean(person.deletedAt);
            return (
              <article key={person.id} className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{person.fullName}</h3>
                    <p className="mt-1 text-sm text-slate-600">{person.shortDescription || "—"}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Обновлено: {formatDate(person.updatedAt)} · Опубликовано: {formatDate(person.publishedAt)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">Статус: {isArchived ? "Скрыт" : "Опубликован"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/persons/${person.id}/edit`} className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700">
                      Редактировать
                    </Link>
                    <AdminArchiveToggle personId={person.id} isArchived={isArchived} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
