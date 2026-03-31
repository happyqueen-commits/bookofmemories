import Link from "next/link";
import { Card } from "@/components/card";
import { SearchForm } from "@/components/search-form";
import { getHomepageData } from "@/lib/content";

export default async function Home() {
  const { featuredPersons, latestArchive, latestStories, latestChronicle, stats } = await getHomepageData();

  return (
    <div className="space-y-10">
      <section className="rounded border border-slate-300 bg-white p-8">
        <h1 className="display-title">Книга памяти: Жизнь Финансового университета во времена СВО</h1>
        <p className="mt-3 text-slate-700">Архивный цифровой мемориал с обязательной модерацией каждого материала.</p>
        <div className="mt-4"><SearchForm placeholder="Искать по всем разделам" /></div>
      </section>

      <section>
        <h2 className="section-title mb-3">Избранные карточки</h2>
        <div className="grid items-stretch gap-4 md:grid-cols-3">{featuredPersons.map((p) => <Card key={p.id} title={p.fullName} text={p.shortDescription} href={`/memory/${p.slug}`} />)}</div>
      </section>

      <section>
        <h2 className="section-title mb-3">Новые архивные материалы</h2>
        <div className="grid items-stretch gap-4 md:grid-cols-2">{latestArchive.map((m) => <Card key={m.id} title={m.title} text={m.description} href={`/archive/${m.slug}`} />)}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="section-title mb-3">Интервью и воспоминания</h2>
          <div className="space-y-3">{latestStories.map((s) => <Card key={s.id} title={s.title} text={s.excerpt} href={`/stories/${s.slug}`} />)}</div>
        </div>
        <div>
          <h2 className="section-title mb-3">Хроника</h2>
          <div className="space-y-3">{latestChronicle.map((e) => <Card key={e.id} title={e.title} text={e.summary} href={`/chronicle/${e.slug}`} />)}</div>
        </div>
      </section>

      <section className="grid gap-3 rounded border border-slate-300 bg-white p-6 sm:grid-cols-2 md:grid-cols-4">
        <div>Персон: {stats[0]}</div><div>Архивных материалов: {stats[1]}</div><div>Историй: {stats[2]}</div><div>Событий: {stats[3]}</div>
      </section>

      <section className="rounded border border-slate-300 bg-white p-6">
        <h2 className="subsection-title">Как работает модерация</h2>
        <p className="mt-2 text-slate-700">Каждый материал проходит проверку модератором: pending → needs_revision / approved / rejected. Публикация происходит только после статуса approved.</p>
        <Link className="mt-3 inline-block" href="/submit">Подать материал</Link>
      </section>
    </div>
  );
}
