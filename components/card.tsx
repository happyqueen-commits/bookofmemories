import Link from "next/link";

export function Card({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <article className="rounded border border-slate-300 bg-white p-4">
      <h3 className="mb-2 text-lg font-semibold"><Link href={href}>{title}</Link></h3>
      <p className="text-sm text-slate-700">{text}</p>
    </article>
  );
}
