import Image from "next/image";
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
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Link
      href={href}
      className="interactive-lift motion-slide-in group block h-full overflow-hidden rounded-2xl border border-[#d6c4a8] bg-[#fffdf9] shadow-[0_8px_20px_rgb(58_39_20_/_0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c2f24] focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col">
        {imageUrl ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[#d9c8ad] bg-[#f2eadc]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-[#d9c8ad] bg-gradient-to-br from-[#f7efdf] via-[#f2e7d2] to-[#eadbc3]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_50%)]" />
            <div className="z-10 flex flex-col items-center gap-2 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ccb38e] bg-[#fff8ea] text-xl font-semibold text-[#70543a]">
                {initials || "?"}
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7254]">Фотография отсутствует</p>
            </div>
          </div>
        )}
        <div className="flex h-full flex-col gap-3 p-5">
          <div>
            <h3 className="card-title break-words text-[#322112]">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm font-medium text-[#76614b]">{subtitle}</p> : null}
          </div>
          <p className="body-muted flex-1 [overflow-wrap:anywhere]">{safeText}</p>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#6d372b] transition-colors group-hover:text-[#5c281e]">
            Открыть карточку
            <span aria-hidden="true" className="text-base leading-none transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
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
