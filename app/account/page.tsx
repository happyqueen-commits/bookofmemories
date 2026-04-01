import { Role } from "@prisma/client";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { AuthForms } from "@/app/account/auth-forms";
import { auth } from "@/lib/auth";
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
        <AuthCard title="Служебный вход" closeHref="/">
          <p className="mb-3 text-sm text-slate-600">Вход только для администраторов и модераторов проекта.</p>
          <AuthForms loginError={loginError} />
        </AuthCard>
      </section>
    );
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.MODERATOR) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Доступ ограничен</h1>
        <p className="mt-2">Этот раздел доступен только администраторам и модераторам.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Служебный кабинет</h1>
      <p className="mt-2">{session.user.name} ({session.user.email}), роль: {session.user.role}</p>
      <div className="mt-4 flex gap-3">
        <Link className="rounded border border-slate-700 bg-slate-700 px-3 py-1.5 text-white" href="/admin">Перейти в модерацию</Link>
        <form action={logoutAction}><button className="rounded border border-slate-400 px-3 py-1.5">Выйти</button></form>
      </div>
    </div>
  );
}
