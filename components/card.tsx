import Link from "next/link";

export function Card({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-transform transition-shadow motion-reduce:transform-none motion-reduce:transition-none motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col">
        <h3 className="card-title mb-2 text-slate-900">{title}</h3>
        <p className="body-muted flex-1">{text}</p>
      </article>
    </Link>
  );
}
