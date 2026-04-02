import Link from "next/link";
import crypto from "node:crypto";
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
  searchParams?: Promise<{ submissionId?: string; accessToken?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const submissionId = (params.submissionId ?? "").trim();
  const accessToken = (params.accessToken ?? "").trim();
  const accessTokenHash = accessToken ? crypto.createHash("sha256").update(accessToken).digest("hex") : "";

  const submission = submissionId && accessTokenHash
    ? await prisma.submission.findFirst({
        where: { id: submissionId, accessTokenHash }
      })
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Статус поданных материалов</h1>
      <p className="mt-2 text-slate-700">Введите ID заявки и ключ доступа из ссылки после отправки материала.</p>

      <form method="get" className="mt-4 flex flex-col gap-3 rounded border border-slate-300 bg-white p-4 sm:flex-row sm:items-end">
        <label className="block flex-1">
          ID заявки
          <input
            name="submissionId"
            required
            defaultValue={submissionId}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="cm8abcd123..."
          />
        </label>
        <label className="block flex-1">
          Ключ доступа
          <input
            name="accessToken"
            required
            defaultValue={accessToken}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="c2b5f5..."
          />
        </label>
        <button className="rounded bg-slate-800 px-4 py-2 text-white">Показать статус</button>
      </form>

      {!submissionId || !accessToken ? null : !submission ? (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Заявка не найдена. Проверьте ID и ключ доступа.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <article className="rounded border border-slate-300 bg-white p-3">
            <p className="text-sm text-slate-500">{getEntityTypeLabel(submission.targetEntityType)}</p>
            <p className="mt-1 text-sm">
              Статус: <strong>{STATUS_LABELS[submission.status] ?? submission.status}</strong>
            </p>
            <p className="text-xs text-slate-500">Обновлено: {submission.updatedAt.toLocaleString("ru-RU")}</p>
            {submission.moderatorComment ? <p className="mt-2 text-sm">Комментарий модератора: {submission.moderatorComment}</p> : null}
            {submission.status === "needs_revision" || submission.status === "rejected" ? (
              <p className="mt-2 text-sm">
                <Link
                  href={`/submit?submissionId=${submission.id}&accessToken=${encodeURIComponent(accessToken)}`}
                  className="underline"
                >
                  Открыть материал для доработки
                </Link>
              </p>
            ) : null}
          </article>
        </div>
      )}

      <p className="mt-6 text-sm text-slate-600">
        Хотите отправить новый материал? <Link href="/submit" className="underline">Перейти к форме отправки</Link>.
      </p>
    </div>
  );
}
