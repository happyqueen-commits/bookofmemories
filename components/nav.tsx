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
      <div className="container-arch py-3">
        <div className="flex items-center justify-between gap-3 border-b border-borderWarm/80 pb-2">
          <Link href="/" className="text-xl font-semibold uppercase tracking-wide text-[#4e3a22] no-underline transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Книга памяти
          </Link>
          <span className="hidden text-xs uppercase tracking-[0.16em] text-[#746247] md:inline">Цифровой архив</span>
        </div>

        <div className="pt-2">
          <NavLinksClient publicLinks={publicLinks} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
