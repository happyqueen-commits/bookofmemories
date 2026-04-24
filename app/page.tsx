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
          <p className="mt-5 max-w-3xl text-[1.03rem] leading-relaxed text-[#5d4732]">Портал хранит подтвержденные сведения о людях и событиях, связанных с историей университета.</p>
        </div>
        <p className="mt-4 text-xs tracking-[0.02em] text-[#775a3c]">Проверенные материалы и публичные карточки участников в едином архиве.</p>
      </section>

      <section className="section-reveal rounded-xl border border-[#d8c7a9] bg-[#efe4cf] p-6 md:p-7">
        <div className="flex items-center justify-between gap-3 border-b border-[#d4c1a0] pb-4">
          <h2 className="text-xl font-semibold text-[#483520] md:text-2xl">О возможностях портала</h2>
          <Link href="/about" className="inline-flex items-center rounded-full border border-[#c8ad87] bg-[#f8efdf] px-3 py-1.5 text-sm font-semibold text-[#6f3b2f] transition-colors hover:bg-[#f2e3cb]">Подробнее</Link>
        </div>
        <ul className="mt-5 grid gap-3 text-[#5a4731] md:grid-cols-3">
          <li className="rounded-lg border border-[#d9c6a8] bg-[#f8efde] px-4 py-4 shadow-[0_5px_14px_rgb(83_57_26_/_0.06)]">Поиск информации о человеке и его жизненном пути.</li>
          <li className="rounded-lg border border-[#d9c6a8] bg-[#f8efde] px-4 py-4 shadow-[0_5px_14px_rgb(83_57_26_/_0.06)]">Публикация и хранение подтвержденных историй.</li>
          <li className="rounded-lg border border-[#d9c6a8] bg-[#f8efde] px-4 py-4 shadow-[0_5px_14px_rgb(83_57_26_/_0.06)]">Строгая модерация перед выводом в открытый доступ.</li>
        </ul>
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
