import { Role } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { NavLinksClient } from "@/components/nav-links-client";

const publicLinks = [
  ["/", "Главная"],
  ["/memory", "Участники"],
  ["/submit", "Добавить материал"],
  ["/submission-status", "Статус заявки"],
  ["/about", "О проекте"]
] as const;

export async function Nav() {
  const session = await auth();
  const isAdmin = session?.user?.role === Role.MODERATOR || session?.user?.role === Role.ADMIN;

  return (
    <header className="sticky top-0 z-50 border-b-2 border-borderWarm bg-[#f2ead9]/95 shadow-sm backdrop-blur-sm">
      <div className="container-arch py-4">
        <div className="flex items-end justify-between gap-4 border-b border-borderWarm/80 pb-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#7b6850]">Цифровой архив</p>
            <Link href="/" className="mt-1 inline-block text-xl font-semibold uppercase tracking-[0.08em] text-[#4e3a22] no-underline transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:text-2xl">
              Книга участников
            </Link>
          </div>
          <span className="hidden rounded-full border border-[#cab18d] bg-[#f8f1e3] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#6e5a42] md:inline">
            Мемориальный проект
          </span>
        </div>

        <div className="pt-3">
          <NavLinksClient publicLinks={publicLinks} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
