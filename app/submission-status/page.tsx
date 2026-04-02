import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEntityTypeLabel } from "@/lib/entity-labels";

const STATUS_LABELS: Record<string, string> = {
  pending: "На рассмотрении",
  needs_revision: "Нужна доработка",
  approved: "Одобрено",
  rejected: "Отклонено",
  draft: "Черновик"
};

export default async function SubmissionStatusPage({
  searchParams
}: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const email = (params.email ?? "").trim().toLowerCase();

  const submissions = email
    ? await prisma.submission.findMany({
        where: { contactEmail: email },
        orderBy: { updatedAt: "desc" }
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Статус поданных материалов</h1>
      <p className="mt-2 text-slate-700">Введите email, который вы указывали при отправке материала.</p>

      <form method="get" className="mt-4 flex flex-col gap-3 rounded border border-slate-300 bg-white p-4 sm:flex-row sm:items-end">
        <label className="block flex-1">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue={email}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="author@example.com"
          />
        </label>
        <button className="rounded bg-slate-800 px-4 py-2 text-white">Показать статус</button>
      </form>

      {!email ? null : submissions.length === 0 ? (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Заявки не найдены. Проверьте email.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {submissions.map((submission) => (
            <article key={submission.id} className="rounded border border-slate-300 bg-white p-3">
              <p className="text-sm text-slate-500">{getEntityTypeLabel(submission.targetEntityType)}</p>
              <p className="text-xs text-slate-500">ID заявки: {submission.id}</p>
              <p className="mt-1 text-sm">
                Статус: <strong>{STATUS_LABELS[submission.status] ?? submission.status}</strong>
              </p>
              <p className="text-xs text-slate-500">Обновлено: {submission.updatedAt.toLocaleString("ru-RU")}</p>
              {submission.moderatorComment ? <p className="mt-2 text-sm">Комментарий модератора: {submission.moderatorComment}</p> : null}
            </article>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-slate-600">
        Хотите отправить новый материал? <Link href="/submit" className="underline">Перейти к форме отправки</Link>.
      </p>
    </div>
  );
}
