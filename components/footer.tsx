import Link from "next/link";
import { PUBLIC_NAV_LINKS, SERVICE_LINKS, SITE_CONFIG } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-[#ccb998] bg-[#efe4cf]">
      <div className="container-arch py-8 md:py-10">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#4e3a22]">{SITE_CONFIG.projectName}</h2>
            <p className="text-sm leading-relaxed text-[#5e4a33]">
              Цифровой архив и патриотический проект, посвящённый людям, историям и материалам, связанным с жизнью
              Финансового университета во времена СВО.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6e5a42]">Навигация</h3>
            <ul className="mt-3 space-y-2">
              {PUBLIC_NAV_LINKS.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#4f3b24] transition-colors hover:text-[#7b4e2f]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6e5a42]">Контакты</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#5e4a33]">{SITE_CONFIG.contactLabel}</p>
            <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="mt-2 inline-block text-sm font-medium text-[#6f3b2f] transition-colors hover:text-[#8a4c2f]">
              {SITE_CONFIG.contactEmail}
            </a>
            <p className="mt-3 text-xs leading-relaxed text-[#6e5a42]">
              Напишите в редакцию, отправьте уточнение по уже опубликованным материалам или подайте новый материал через
              форму на странице <Link href="/submit" className="font-semibold text-[#6f3b2f]">«Добавить материал»</Link>.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6e5a42]">Служебные ссылки</h3>
            <ul className="mt-3 space-y-2">
              {SERVICE_LINKS.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#4f3b24] transition-colors hover:text-[#7b4e2f]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-8 border-t border-[#cfba97] pt-4 text-xs leading-relaxed text-[#6e5a42]">
          <p>Все материалы проходят предварительную модерацию перед публикацией в открытом доступе.</p>
          <p className="mt-2">© 2026 Книга участников. Патриотический проект КИПФИН Финансового университета.</p>
        </div>
      </div>
    </footer>
  );
}
