import { Role } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { NavLinksClient } from "@/components/nav-links-client";

const publicLinks = [
  ["/", "Главная"],
  ["/memory", "Книга памяти"],
  ["/chronicle", "Хроника"],
  ["/submit", "Добавить материал"],
  ["/about", "О проекте"]
] as const;

export async function Nav() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);
  const isAdmin = session?.user?.role === Role.MODERATOR || session?.user?.role === Role.ADMIN;

  return (
    <header className="sticky top-0 z-50 border-b border-patriot-blue/25 bg-white/80 backdrop-blur-md">
      <div className="container-arch flex items-center justify-between gap-3 py-3 md:py-4">
        <Link href="/" className="text-lg font-semibold text-patriot-blue no-underline transition-colors hover:text-patriot-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          Книга памяти
        </Link>

        <NavLinksClient publicLinks={publicLinks} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
