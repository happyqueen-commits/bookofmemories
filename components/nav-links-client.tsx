"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = readonly [href: string, label: string];

type NavLinksClientProps = {
  publicLinks: readonly NavLink[];
  isAuthenticated: boolean;
  isAdmin: boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getLinkClasses(active: boolean) {
  return [
    "rounded-md px-3 py-2 font-medium no-underline transition-colors duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    active
      ? "bg-slate-800 text-white hover:bg-slate-900 focus-visible:outline-slate-800"
      : "text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:bg-slate-300"
  ].join(" ");
}

export function NavLinksClient({ publicLinks, isAuthenticated, isAdmin }: NavLinksClientProps) {
  const pathname = usePathname() || "/";
  const [isOpen, setIsOpen] = useState(false);

  const accountLabel = isAuthenticated ? "Кабинет" : "Войти";

  const links = [
    ...publicLinks,
    ["/account", accountLabel] as const,
    ...(isAdmin ? ([["/admin", "Админ"]] as const) : [])
  ];

  return (
    <>
      <nav aria-label="Основная навигация" className="hidden items-center gap-2 text-sm md:flex">
        {links.map(([href, label]) => (
          <Link key={href} href={href} aria-current={isActivePath(pathname, href) ? "page" : undefined} className={getLinkClasses(isActivePath(pathname, href))}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="relative w-full md:hidden">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((prev) => !prev)}
          className="ml-auto flex min-h-11 w-fit items-center gap-2 rounded-md border border-slate-400 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true" className="text-base leading-none">{isOpen ? "✕" : "☰"}</span>
          <span>{isOpen ? "Закрыть" : "Меню"}</span>
        </button>

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <nav id="mobile-navigation" aria-label="Мобильная навигация" className="overflow-hidden rounded-lg border border-slate-300 bg-white/95 text-sm shadow-lg backdrop-blur">
            <ul className="flex flex-col p-2">
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActivePath(pathname, href) ? "page" : undefined}
                    className={`${getLinkClasses(isActivePath(pathname, href))} block min-h-11 px-3 py-2.5`}
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
