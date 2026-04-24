import Link from "next/link";

export const metadata = {
  title: "Правила публикации материалов | Книга участников",
  description: "Требования к подаче и публикации материалов в проекте «Книга участников»."
};

export default function PublicationRulesPage() {
  return (
    <article className="mx-auto max-w-4xl rounded-xl border border-[#ccb998] bg-[#fbf8f1] p-6 shadow-panel md:p-8">
      <h1 className="display-title text-[#483520]">Правила публикации материалов</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#5e4a33]">
        Материалы публикуются после предварительной проверки редакцией. Это помогает сохранить точность сведений и уважительный
        тон повествования.
      </p>

      <section className="mt-6 space-y-3 text-[#4f3b24]">
        <h2 className="subsection-title text-[#483520]">Что можно подать</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Биографические сведения и подтверждённые факты.</li>
          <li>Фотографии и документы, которые можно разместить публично.</li>
          <li>Уточнения к ранее опубликованным карточкам участников.</li>
        </ul>
      </section>

      <section className="mt-6 space-y-3 text-[#4f3b24]">
        <h2 className="subsection-title text-[#483520]">Что проверяет редакция</h2>
        <p>Корректность формулировок, полноту источников, отсутствие недостоверных или нарушающих права третьих лиц сведений.</p>
      </section>

      <p className="mt-6 text-sm leading-relaxed text-[#5e4a33]">
        Для отправки нового материала используйте страницу <Link href="/submit" className="font-semibold text-[#6f3b2f]">«Добавить материал»</Link>.
      </p>
    </article>
  );
}
