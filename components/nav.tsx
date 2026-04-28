import { Role } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { NavLinksClient } from "@/components/nav-links-client";

import { PUBLIC_NAV_LINKS } from "@/lib/site-config";

export async function Nav() {
  const session = await auth();
  const isAdmin = session?.user?.role === Role.MODERATOR || session?.user?.role === Role.ADMIN;

  return (
    <header className="sticky top-0 z-50 border-b border-[#ccb998] bg-[#f3ebdd]/95 shadow-[0_4px_16px_rgb(52_34_16_/_0.07)] backdrop-blur-sm">
      <div className="container-arch py-3">
        <div className="flex items-end justify-between gap-3 border-b border-[#ccb998] pb-2.5">
          <div className="rounded-lg bg-[#f9f2e4] px-3 py-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#7b6850]">Цифровой архив</p>
            <Link href="/" className="mt-1 inline-block text-xl font-semibold uppercase tracking-[0.08em] text-[#4e3a22] no-underline transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:text-2xl">
              Книга участников
            </Link>
          </div>
          <span className="hidden rounded-full border border-[#cab18d] bg-[#f8f1e3] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#6e5a42] md:inline">
            Патриотический проект
          </span>
        </div>

        <div className="pt-2.5">
          <NavLinksClient publicLinks={PUBLIC_NAV_LINKS} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
