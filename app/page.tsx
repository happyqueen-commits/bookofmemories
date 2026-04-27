export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, formatLifespan } from "@/components/card";
import { getHomepageData } from "@/lib/content";

export default async function Home() {
  const { featuredPersons, stats } = await getHomepageData();

  return (
    <div className="space-y-rhythm">
      <section className="rounded-xl border-2 border-[#ccb089] bg-gradient-to-br from-[#f9f3e6] via-[#f6efdf] to-[#efe1c8] p-6 shadow-[0_14px_38px_rgb(76_50_24_/_0.14)] md:p-10">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5b3a]">Электронный архив участников</p>
          <h1 className="mt-5 display-title text-[#3f2e1f]">Книга участников: Жизнь Финансового университета во времена СВО</h1>
          <p className="mt-5 max-w-3xl text-[1.03rem] leading-relaxed text-[#5d4732]">
            Студенты, сотрудники и выпускники Финансового университета могут добавить сюда историю о своих родных и близких, участвующих в СВО. Все материалы проходят предварительную проверку перед публикацией.
          </p>
        </div>
        <p className="mt-4 text-xs tracking-[0.02em] text-[#775a3c]">Проверенные материалы и публичные карточки участников в едином архиве.</p>
      </section>

      <section className="section-reveal reveal-delay-2 rounded-xl border border-[#cdb99a] bg-[#fbf8f1] p-6 shadow-panel md:p-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="section-title text-[#483520]">Избранные карточки</h2>
          <Link href="/memory" className="text-sm font-semibold text-[#6f3b2f]">Все участники</Link>
        </div>
        <div className="grid items-stretch gap-5 md:grid-cols-3">
          {featuredPersons.map((p) => (
            <Card
              key={p.id}
              title={p.fullName}
              subtitle={formatLifespan(p.birthDate, p.deathDate)}
              imageUrl={p.photoUrl}
              text={p.shortDescription}
              href={`/memory/${p.slug}`}
            />
          ))}
        </div>
      </section>

      <section className="section-reveal reveal-delay-3 rounded-xl border border-[#b5bcaa] bg-section-olive p-section-pad">
        <h2 className="subsection-title text-[#39412f]">Новые материалы</h2>
        <div className="mt-3 inline-flex rounded-lg border border-[#879170] bg-[#f8faee] px-5 py-3">
          <p className="text-3xl font-bold leading-none text-[#566046]">{stats}</p>
          <p className="ml-3 pt-2 text-sm text-[#556146]">персон в опубликованной книге участников</p>
        </div>
      </section>
    </div>
  );
}
