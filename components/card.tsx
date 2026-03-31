import Link from "next/link";

export function Card({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <article className="rounded border border-slate-300 bg-white p-4">
      <h3 className="card-title mb-2"><Link href={href}>{title}</Link></h3>
      <p className="body-muted">{text}</p>
    </article>
  );
}
