import Link from "next/link";
import { Card } from "@/components/card";
import { SearchForm } from "@/components/search-form";
import { getHomepageData } from "@/lib/content";

export default async function Home() {
  const { featuredPersons, stats } = await getHomepageData();

  return (
    <div className="space-y-rhythm">
      <section className="rounded-sm border-2 border-borderWarm bg-section-cream p-section-pad shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#866540]">Поиск документов об участниках</p>
        <h1 className="mt-3 display-title max-w-4xl text-[#3f2e1f]">Книга памяти: Жизнь Финансового университета во времена СВО</h1>
        <p className="mt-3 max-w-3xl text-[#5d4732]">Уточняйте имя и факты о человеке, чтобы быстрее перейти в карточку и ознакомиться с подтвержденными материалами архива.</p>
        <div className="mt-6 rounded-sm border border-[#ccb18b] bg-[#fefbf1] p-4">
          <SearchForm placeholder="Фамилия, имя, подразделение или событие" />
        </div>
      </section>

      <section className="section-reveal rounded-sm border border-[#d5c5a6] bg-section-sand p-section-pad">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title text-[#483520]">О возможностях портала</h2>
          <Link href="/about" className="text-sm font-semibold text-accent">Подробнее</Link>
        </div>
        <ul className="mt-4 grid gap-2 text-[#5a4731] md:grid-cols-3">
          <li className="rounded-sm border border-[#dac8ab] bg-[#f6ecda] px-4 py-3">Поиск информации о человеке и его жизненном пути.</li>
          <li className="rounded-sm border border-[#dac8ab] bg-[#f6ecda] px-4 py-3">Публикация и хранение подтвержденных историй.</li>
          <li className="rounded-sm border border-[#dac8ab] bg-[#f6ecda] px-4 py-3">Строгая модерация перед выводом в открытый доступ.</li>
        </ul>
      </section>

      <section className="section-reveal reveal-delay-2 rounded-sm border border-[#c9b799] bg-white p-section-pad">
        <h2 className="section-title mb-3 text-[#483520]">Избранные карточки</h2>
        <div className="grid items-stretch gap-4 md:grid-cols-3">{featuredPersons.map((p) => <Card key={p.id} title={p.fullName} text={p.shortDescription} href={`/memory/${p.slug}`} />)}</div>
      </section>

      <section className="section-reveal reveal-delay-3 rounded-sm border border-[#b8c0ae] bg-section-olive p-section-pad">
        <h2 className="subsection-title text-[#39412f]">Новые материалы</h2>
        <div className="mt-3 inline-flex rounded-sm border border-[#879170] bg-[#f8faee] px-5 py-3">
          <p className="text-3xl font-bold leading-none text-[#566046]">{stats}</p>
          <p className="ml-3 pt-2 text-sm text-[#556146]">персон в опубликованной книге памяти</p>
        </div>
      </section>
    </div>
  );
}
