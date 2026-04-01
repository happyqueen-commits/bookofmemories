import { Role } from "@prisma/client";
import { logoutAction } from "@/lib/actions";
import { AuthForms } from "@/app/account/auth-forms";
import { auth } from "@/lib/auth";
import { getEntityTypeLabel, getSubmissionTypeLabel } from "@/lib/entity-labels";
import { prisma } from "@/lib/prisma";
import { AuthCard } from "@/components/auth-card";

export default async function AccountPage({
  searchParams
}: {
  searchParams?: { error?: string; code?: string };
}) {
  const session = await auth();
  const loginError = searchParams?.error === "CredentialsSignin" ? searchParams?.code : searchParams?.error;

  if (!session?.user) {
    return (
      <section className="auth-screen-center">
        <AuthCard title="Кабинет автора" closeHref="/">
          <AuthForms loginError={loginError} />
        </AuthCard>
      </section>
    );
  }

  const submissions = await prisma.submission.findMany({ where: { authorId: session.user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Личный кабинет</h1>
      <p className="mt-2">{session.user.name} ({session.user.email}), роль: {session.user.role}</p>
      {session.user.role !== Role.AUTHOR && <p className="mt-2 text-sm">У вас есть доступ к модерации: /admin.</p>}
      <form action={logoutAction} className="mt-2"><button className="rounded border border-slate-400 px-3 py-1">Выйти</button></form>

      <h2 className="mt-6 mb-3 text-xl font-semibold">Мои заявки</h2>
      <div className="space-y-3">
        {submissions.map((s) => (
          <article key={s.id} className="rounded border border-slate-300 bg-white p-3">
            <div className="text-sm">{getEntityTypeLabel(s.targetEntityType)} / {getSubmissionTypeLabel(s.submissionType)}</div>
            <div className="font-medium">Статус: {s.status}</div>
            {s.moderatorComment && <p className="text-sm text-slate-700">Комментарий: {s.moderatorComment}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
