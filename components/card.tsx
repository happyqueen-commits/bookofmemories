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
      className="interactive-lift motion-slide-in group block h-full rounded-sm border border-[#cfbea0] bg-[#fffdf7] p-4 shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c2f24] focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col gap-3">
        {imageUrl ? (
          <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-sm border border-[#cfbea0] bg-[#f7f1e5]">
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : null}
        <div>
          <h3 className="card-title break-words text-[#3d2d1f]">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-[#77624d]">{subtitle}</p> : null}
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
