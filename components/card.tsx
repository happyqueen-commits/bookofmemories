import Link from "next/link";
import { PersonImage } from "@/components/person-image";
import { getPersonImageAlt } from "@/lib/placeholders";

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
  const altText = getPersonImageAlt(title, imageUrl);

  return (
    <Link
      href={href}
      className="interactive-lift motion-slide-in group block h-full overflow-hidden rounded-2xl border border-[#d6c4a8] bg-[#fffdf9] shadow-[0_8px_20px_rgb(58_39_20_/_0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c2f24] focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-[4/5] w-full overflow-hidden border-b border-[#d9c8ad] bg-[#f2eadc]">
          <PersonImage
            src={imageUrl}
            alt={altText}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        </div>
        <div className="flex h-full flex-col gap-3 p-5">
          <div>
            <h3 className="card-title break-words text-[#322112]">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm font-medium text-[#76614b]">{subtitle}</p> : null}
          </div>
          {safeText ? (
            <p className="body-muted flex-1 overflow-hidden [display:-webkit-box] [overflow-wrap:anywhere] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
              {safeText}
            </p>
          ) : (
            <div className="flex-1" />
          )}
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

  if (birth && death) return `${birth} — ${death}`;
  return birth ?? death;
}
