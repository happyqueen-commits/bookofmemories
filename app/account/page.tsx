import { Role } from "@prisma/client";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { AuthForms } from "@/app/account/auth-forms";
import { auth } from "@/lib/auth";
import { getEntityTypeLabel, getSubmissionTypeLabel } from "@/lib/entity-labels";
import { prisma } from "@/lib/prisma";
import { AuthCard } from "@/components/auth-card";

const STATUS_OPTIONS = ["pending", "needs_revision", "approved", "rejected"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const STATUS_BADGE_CLASS: Record<StatusFilter, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  needs_revision: "border-orange-200 bg-orange-50 text-orange-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800"
};

const STATUS_LABEL: Record<StatusFilter, string> = {
  pending: "На рассмотрении",
  needs_revision: "Нужна доработка",
  approved: "Одобрено",
  rejected: "Отклонено"
};

function isStatusFilter(value: string | undefined): value is StatusFilter {
  return Boolean(value && STATUS_OPTIONS.includes(value as StatusFilter));
}

function buildResubmitHref(targetEntityType: string, payloadJson: unknown) {
  const params = new URLSearchParams({ targetEntityType });
  if (payloadJson && typeof payloadJson === "object" && !Array.isArray(payloadJson)) {
    for (const [key, rawValue] of Object.entries(payloadJson)) {
      if (rawValue === undefined || rawValue === null) continue;
      if (typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
        params.set(key, String(rawValue));
        continue;
      }

      if (Array.isArray(rawValue)) {
        const serializedValues = rawValue.filter((item) => ["string", "number", "boolean"].includes(typeof item)).map(String);
        if (serializedValues.length) params.set(key, serializedValues.join(", "));
      }
    }
  }

  return `/submit?${params.toString()}`;
}

export default async function AccountPage({
  searchParams
}: {
  searchParams?: { error?: string; code?: string; status?: string };
}) {
  const session = await auth();
  const loginError = searchParams?.error === "CredentialsSignin" ? searchParams?.code : searchParams?.error;
  const currentStatusFilter = isStatusFilter(searchParams?.status) ? searchParams?.status : "all";

  if (!session?.user) {
    return (
      <section className="auth-screen-center">
        <AuthCard title="Кабинет автора" closeHref="/">
          <AuthForms loginError={loginError} />
        </AuthCard>
      </section>
    );
  }

  const submissions = await prisma.submission.findMany({
    where: {
      authorId: session.user.id,
      status: currentStatusFilter === "all" ? { in: [...STATUS_OPTIONS] } : currentStatusFilter
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Личный кабинет</h1>
      <p className="mt-2">{session.user.name} ({session.user.email}), роль: {session.user.role}</p>
      {session.user.role !== Role.AUTHOR && <p className="mt-2 text-sm">У вас есть доступ к модерации: /admin.</p>}
      <form action={logoutAction} className="mt-2"><button className="rounded border border-slate-400 px-3 py-1">Выйти</button></form>

      <h2 className="mt-6 mb-3 text-xl font-semibold">История заявок</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <Link
          href="/account"
          className={`rounded-full border px-3 py-1 text-sm ${currentStatusFilter === "all" ? "border-slate-700 bg-slate-700 text-white" : "border-slate-300 bg-white text-slate-700"}`}
        >
          Все
        </Link>
        {STATUS_OPTIONS.map((status) => (
          <Link
            key={status}
            href={`/account?status=${status}`}
            className={`rounded-full border px-3 py-1 text-sm ${currentStatusFilter === status ? "border-slate-700 bg-slate-700 text-white" : "border-slate-300 bg-white text-slate-700"}`}
          >
            {STATUS_LABEL[status]}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {submissions.map((s) => (
          <article key={s.id} className="rounded border border-slate-300 bg-white p-3">
            <div className="text-sm">{getEntityTypeLabel(s.targetEntityType)} / {getSubmissionTypeLabel(s.submissionType)}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[s.status as StatusFilter] ?? "border-slate-200 bg-slate-100 text-slate-800"}`}>
                {STATUS_LABEL[s.status as StatusFilter] ?? s.status}
              </span>
              <span className="text-xs text-slate-500">
                Изменено: {s.updatedAt.toLocaleString("ru-RU")}
              </span>
            </div>
            {s.moderatorComment && <p className="text-sm text-slate-700">Комментарий: {s.moderatorComment}</p>}
            {s.status === "needs_revision" && (
              <Link
                href={buildResubmitHref(s.targetEntityType, s.payloadJson)}
                className="mt-3 inline-flex rounded border border-slate-700 bg-slate-700 px-3 py-1.5 text-sm text-white"
              >
                Исправить и отправить заново
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
