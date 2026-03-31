import { Role } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/lib/auth";

const publicLinks = [
  ["/", "Главная"],
  ["/memory", "Книга памяти"],
  ["/archive", "Архив"],
  ["/stories", "Интервью"],
  ["/chronicle", "Хроника"],
  ["/submit", "Добавить материал"],
  ["/about", "О проекте"]
] as const;

export async function Nav() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);
  const isAdmin = session?.user?.role === Role.MODERATOR || session?.user?.role === Role.ADMIN;

  return (
    <header className="border-b border-slate-300 bg-white/80">
      <div className="container-arch flex items-center justify-between gap-3 py-4">
        <Link href="/" className="text-lg font-semibold text-ink no-underline">
          Книга памяти
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-3 text-sm md:flex">
          {publicLinks.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          {isAuthenticated ? <Link href="/account">Кабинет</Link> : <Link href="/account">Войти</Link>}
          {isAdmin && <Link href="/admin">Админ</Link>}
        </nav>

        <details className="relative w-full md:hidden">
          <summary className="ml-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span aria-hidden="true">☰</span>
            <span>Меню</span>
          </summary>

          <nav
            aria-label="Мобильная навигация"
            className="mt-3 flex flex-col gap-2 rounded border border-slate-200 bg-white p-3 text-sm"
          >
            {publicLinks.map(([href, label]) => (
              <Link key={href} href={href} className="rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link href="/account" className="rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                Кабинет
              </Link>
            ) : (
              <Link href="/account" className="rounded px-2 py-1 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                Войти
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                Админ
              </Link>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
