"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = readonly [href: string, label: string];

type NavLinksClientProps = {
  publicLinks: readonly NavLink[];
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
    "rounded-md border px-3.5 py-2.5 text-sm font-semibold tracking-[0.01em] no-underline transition-colors duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    active
      ? "border-[#7c2d22] bg-accent text-[#fff8ee] shadow-sm hover:bg-[#74261d]"
      : "border-[#d6c3a4] bg-[#f8f1e3] text-[#5c4a35] hover:bg-[#ecdfc8] hover:text-[#3f2f20]"
  ].join(" ");
}

export function NavLinksClient({ publicLinks, isAdmin }: NavLinksClientProps) {
  const pathname = usePathname() || "/";
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    ...publicLinks,
    ...(isAdmin ? ([["/admin", "Админ"], ["/account", "Кабинет"]] as const) : [])
  ];

  return (
    <>
      <nav aria-label="Основная навигация" className="hidden flex-wrap items-center gap-2.5 md:flex">
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
          className="ml-auto flex min-h-11 w-fit items-center gap-2 rounded-md border border-[#b69b74] bg-[#f9f2e4] px-4 py-2 text-sm font-semibold text-[#3d2f1f] shadow-sm transition-colors duration-200 hover:bg-[#efe2cb] active:bg-[#e3d2b1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true" className="text-base leading-none">{isOpen ? "✕" : "☰"}</span>
          <span>{isOpen ? "Закрыть" : "Разделы"}</span>
        </button>

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <nav id="mobile-navigation" aria-label="Мобильная навигация" className="overflow-hidden rounded-md border border-[#c9b08c] bg-[#fcf8ee] text-sm shadow-panel">
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
