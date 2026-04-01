import Link from "next/link";

export function Card({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <Link
      href={href}
      className="interactive-lift motion-slide-in group block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col">
        <h3 className="card-title mb-2 break-words text-slate-900">{title}</h3>
        <p className="body-muted flex-1 [overflow-wrap:anywhere]">{text}</p>
      </article>
    </Link>
  );
}
