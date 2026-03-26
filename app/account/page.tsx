import { Role } from "@prisma/client";
import { loginAction, logoutAction } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="max-w-md">
        <h1 className="mb-4 text-2xl font-semibold">Кабинет автора</h1>
        <form action={loginAction} className="space-y-3 rounded border border-slate-300 bg-white p-4">
          <label className="block">Email<input type="email" name="email" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required /></label>
          <label className="block">Пароль<input type="password" name="password" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required /></label>
          <button className="rounded bg-slate-800 px-4 py-2 text-white" type="submit">Войти</button>
        </form>
      </div>
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
            <div className="text-sm">{s.targetEntityType} / {s.submissionType}</div>
            <div className="font-medium">Статус: {s.status}</div>
            {s.moderatorComment && <p className="text-sm text-slate-700">Комментарий: {s.moderatorComment}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
