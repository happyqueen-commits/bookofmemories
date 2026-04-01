import Link from "next/link";
import { Card } from "@/components/card";
import { SearchForm } from "@/components/search-form";
import { getHomepageData } from "@/lib/content";

export default async function Home() {
  const { featuredPersons, latestChronicle, stats } = await getHomepageData();

  return (
    <div className="space-y-rhythm">
      <section className="rounded border border-patriot-blue/30 bg-white/90 p-section-pad shadow-sm backdrop-blur-sm">
        <span className="inline-flex rounded-full border border-patriot-blue/30 bg-tint-lavender px-3 py-1 text-xs font-semibold uppercase tracking-wide text-patriot-blue">
          Цифровой мемориал
        </span>
        <div className="mt-4 h-1 w-44 rounded-full bg-gradient-to-r from-patriot-white via-patriot-blue to-patriot-red" />
        <h1 className="mt-5 display-title">Книга памяти: Жизнь Финансового университета во времена СВО</h1>
        <p className="mt-3 text-slate-700">Архивный цифровой мемориал с обязательной модерацией каждого материала.</p>
        <div className="mt-4"><SearchForm placeholder="Искать по всем разделам" /></div>
      </section>

      <section className="section-reveal rounded border border-patriot-blue/20 bg-tint-lavender p-section-pad shadow-sm">
        <h2 className="section-title mb-3">Избранные карточки</h2>
        <div className="grid items-stretch gap-4 md:grid-cols-3">{featuredPersons.map((p) => <Card key={p.id} title={p.fullName} text={p.shortDescription} href={`/memory/${p.slug}`} />)}</div>
      </section>


      <section className="section-reveal reveal-delay-2 rounded border border-patriot-blue/20 bg-tint-sky p-section-pad shadow-sm">
        <h2 className="section-title mb-3">Хроника</h2>
        <div className="space-y-3">{latestChronicle.map((e) => <Card key={e.id} title={e.title} text={e.summary} href={`/chronicle/${e.slug}`} />)}</div>
      </section>

      <section className="section-reveal reveal-delay-3 rounded border border-patriot-red/20 bg-white/95 p-section-pad shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-patriot-blue/15 bg-tint-lavender p-4">
            <p className="text-3xl font-bold leading-none text-accent">{stats[0]}</p>
            <p className="mt-2 text-sm text-slate-600">Персон</p>
          </div>
          <div className="rounded-lg border border-patriot-red/20 bg-tint-rose p-4">
            <p className="text-3xl font-bold leading-none text-accent">{stats[1]}</p>
            <p className="mt-2 text-sm text-slate-600">Событий</p>
          </div>
        </div>
      </section>

      <section className="section-reveal reveal-delay-4 rounded border border-patriot-blue/20 bg-tint-sky p-section-pad shadow-sm">
        <h2 className="subsection-title">Как работает модерация</h2>
        <p className="mt-2 text-slate-700">Каждый материал проходит проверку модератором: pending → needs_revision / approved / rejected. Публикация происходит только после статуса approved.</p>
        <Link className="interactive-lift mt-3 inline-block rounded px-1 py-0.5 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2" href="/submit">Подать материал</Link>
      </section>
    </div>
  );
}
