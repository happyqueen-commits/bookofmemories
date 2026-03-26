import Link from "next/link";

const links = [
  ["/", "Главная"],
  ["/memory", "Книга памяти"],
  ["/archive", "Архив"],
  ["/stories", "Интервью"],
  ["/chronicle", "Хроника"],
  ["/submit", "Добавить материал"],
  ["/about", "О проекте"]
];

export function Nav() {
  return (
    <header className="border-b border-slate-300 bg-white/80">
      <div className="container-arch flex flex-wrap items-center justify-between gap-3 py-4">
        <Link href="/" className="font-semibold text-lg text-ink no-underline">Книга памяти</Link>
        <nav className="flex flex-wrap gap-3 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
          <Link href="/account">Кабинет</Link>
          <Link href="/admin">Админ</Link>
        </nav>
      </div>
    </header>
  );
}
