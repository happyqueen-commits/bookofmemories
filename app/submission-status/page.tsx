import Link from "next/link";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEntityTypeLabel } from "@/lib/entity-labels";
import { requestSubmissionStatusCodeAction, verifySubmissionStatusCodeAction } from "@/lib/actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "На рассмотрении",
  needs_revision: "Нужна доработка",
  approved: "Одобрено",
  rejected: "Отклонено",
  draft: "Черновик"
};

const SUBMISSION_STATUS_SESSION_COOKIE = "submission_status_session";

type StatusSearchParams = {
  email?: string;
  codeRequested?: string;
  codeRequestError?: string;
  retryAfter?: string;
  verifyError?: string;
  verified?: string;
};

function renderCodeRequestMessage(error?: string, retryAfter?: string) {
  if (!error) return null;

  if (error === "cooldown") {
    return (
      <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Новый код можно запросить чуть позже. Повторите через {retryAfter ?? "60"} сек.
      </p>
    );
  }

  if (error === "too_many_requests") {
    return (
      <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Слишком много запросов. Попробуйте снова позже.
      </p>
    );
  }

  if (error === "email_limit") {
    return (
      <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Для этого email достигнут лимит отправки кодов. Попробуйте снова через час.
      </p>
    );
  }

  if (error === "delivery_failed") {
    return (
      <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Не удалось отправить письмо с кодом. Попробуйте еще раз позже.
      </p>
    );
  }

  return (
    <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      Укажите корректный email.
    </p>
  );
}

function renderVerifyMessage(error?: string) {
  if (!error) return null;

  if (error === "invalid_code") {
    return (
      <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Код недействителен или истек. Проверьте письмо или запросите новый код.
      </p>
    );
  }

  if (error === "expired") {
    return (
      <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Активный код не найден. Запросите новый код для доступа к статусу.
      </p>
    );
  }

  if (error === "too_many_attempts") {
    return (
      <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Слишком много попыток ввода. Попробуйте позже.
      </p>
    );
  }

  return (
    <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      Проверьте email и код подтверждения.
    </p>
  );
}

export default async function SubmissionStatusPage({
  searchParams
}: {
  searchParams?: Promise<StatusSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const email = (params.email ?? "").trim().toLowerCase();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SUBMISSION_STATUS_SESSION_COOKIE)?.value;

  let submissions: Awaited<ReturnType<typeof prisma.submission.findMany>> = [];
  let verifiedEmail: string | null = null;

  if (sessionToken) {
    const sessionTokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const now = new Date();
    const accessSession = await prisma.submissionAccessSession.findUnique({
      where: { tokenHash: sessionTokenHash },
      select: { email: true, expiresAt: true }
    });

    if (accessSession && accessSession.expiresAt > now) {
      verifiedEmail = accessSession.email;
      submissions = await prisma.submission.findMany({
        where: { contactEmail: accessSession.email },
        orderBy: { updatedAt: "desc" }
      });
    }
  }

  const hasAccess = Boolean(verifiedEmail);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Статус поданных материалов</h1>
      <p className="mt-2 text-slate-700">Введите email, получите одноразовый код и подтвердите доступ к заявке.</p>

      {!hasAccess ? (
        <div className="mt-4 space-y-4">
          <form action={requestSubmissionStatusCodeAction} className="rounded border border-slate-300 bg-white p-4">
            <label className="block">
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
            <button className="mt-3 rounded bg-slate-800 px-4 py-2 text-white">Отправить код</button>
            {params.codeRequested === "1" ? (
              <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Если заявка с этим email найдена, мы отправили код подтверждения на почту.
              </p>
            ) : null}
            {renderCodeRequestMessage(params.codeRequestError, params.retryAfter)}
          </form>

          <form action={verifySubmissionStatusCodeAction} className="rounded border border-slate-300 bg-white p-4">
            <p className="text-sm text-slate-700">Введите код из письма, чтобы подтвердить email и открыть статус заявки.</p>
            <label className="mt-3 block">
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
            <label className="mt-3 block">
              Код подтверждения
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                placeholder="123456"
              />
            </label>
            <button className="mt-3 rounded bg-slate-800 px-4 py-2 text-white">Подтвердить и показать статус</button>
            {renderVerifyMessage(params.verifyError)}
          </form>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {params.verified === "1" ? (
            <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Email подтвержден. Ниже показан актуальный статус ваших заявок.
            </p>
          ) : null}
          <p className="text-sm text-slate-600">Подтвержденный email: {verifiedEmail}</p>
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
          <form action={requestSubmissionStatusCodeAction} className="rounded border border-slate-200 bg-slate-50 p-3">
            <input type="hidden" name="email" value={verifiedEmail ?? ""} />
            <button className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700">Отправить код повторно</button>
          </form>
        </div>
      )}

      <p className="mt-6 text-sm text-slate-600">
        Хотите отправить новый материал? <Link href="/submit" className="underline">Перейти к форме отправки</Link>.
      </p>
    </div>
  );
}
