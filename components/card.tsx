import Link from "next/link";

type CardProps = {
  title: string;
  text: string;
  href: string;
  imageUrl?: string | null;
  subtitle?: string;
};

function formatCardDate(value: Date | null) {
  if (!value) return undefined;
  if (Number.isNaN(value.getTime())) return undefined;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(value);
}

export function Card({ title, text, href, imageUrl, subtitle }: CardProps) {
  const safeText = text.trim();

  return (
    <Link
      href={href}
      className="interactive-lift motion-slide-in group block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-52 w-full rounded-lg object-cover"
            loading="lazy"
          />
        ) : null}
        <div>
          <h3 className="card-title break-words text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <p className="body-muted flex-1 [overflow-wrap:anywhere]">{safeText}</p>
      </article>
    </Link>
  );
}

export function formatLifespan(birthDate: Date | null, deathDate: Date | null) {
  const birth = formatCardDate(birthDate);
  const death = formatCardDate(deathDate);

  if (!birth && !death) return undefined;

  return `${birth ?? "?"} — ${death ?? "?"}`;
}
