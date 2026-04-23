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
  searchParams?: Promise<{ email?: string; token?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const email = (params.email ?? "").trim().toLowerCase();
  const token = (params.token ?? "").trim();
  const now = new Date();

  let refreshedToken: string | null = null;
  let submissions: Awaited<ReturnType<typeof prisma.submission.findMany>> = [];

  if (token) {
    const accessTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    submissions = await prisma.submission.findMany({
      where: {
        accessTokenHash,
        accessTokenExpiresAt: { gt: now },
        ...(email ? { contactEmail: email } : {})
      },
      orderBy: { updatedAt: "desc" }
    });

    if (submissions.length > 0) {
      refreshedToken = crypto.randomBytes(32).toString("base64url");
      const refreshedHash = crypto.createHash("sha256").update(refreshedToken).digest("hex");
      const refreshedExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.submission.updateMany({
        where: { id: { in: submissions.map((submission) => submission.id) } },
        data: {
          accessTokenHash: refreshedHash,
          accessTokenExpiresAt: refreshedExpiresAt
        }
      });
    }
  }

  const hasValidToken = submissions.length > 0;
  const hasLookupAttempt = Boolean(token || email);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Статус поданных материалов</h1>
      <p className="mt-2 text-slate-700">Введите токен из защищенной ссылки. Email можно указать дополнительно для точного поиска.</p>

      <form method="get" className="mt-4 flex flex-col gap-3 rounded border border-slate-300 bg-white p-4 sm:flex-row sm:items-end">
        <label className="block flex-1">
          Токен доступа
          <input
            name="token"
            required
            defaultValue={token}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Вставьте токен из ссылки"
          />
        </label>
        <label className="block flex-1">
          Email (необязательно)
          <input
            name="email"
            type="email"
            defaultValue={email}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="author@example.com"
          />
        </label>
        <button className="rounded bg-slate-800 px-4 py-2 text-white">Показать статус</button>
      </form>

      {hasLookupAttempt && !hasValidToken ? (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Не удалось подтвердить доступ. Проверьте токен и попробуйте снова.
        </p>
      ) : null}

      {hasValidToken ? (
        <div className="mt-4 space-y-3">
          {refreshedToken ? (
            <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              Для безопасности ссылка обновлена. Используйте новую ссылку:{" "}
              <Link href={`/submission-status?token=${encodeURIComponent(refreshedToken)}`} className="underline">
                открыть статус
              </Link>
              .
            </p>
          ) : null}
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
      ) : null}

      <p className="mt-6 text-sm text-slate-600">
        Хотите отправить новый материал? <Link href="/submit" className="underline">Перейти к форме отправки</Link>.
      </p>
    </div>
  );
}
