export default function AboutPage() {
  return (
    <div className="rounded-2xl bg-paper py-6 md:py-8">
      <article className="mx-auto max-w-4xl rounded-2xl border border-[#d8ccb2] bg-[#f9f5eb] px-6 py-8 shadow-panel md:px-10 md:py-10">
        <h1 className="section-title text-[#3f2e1f]">О проекте</h1>

        <div className="mt-5 space-y-4 text-[15px] leading-7 text-[#5d4732] md:text-base">
          <p>
            «Книга памяти» — это цифровой архив Финансового университета, посвящённый людям,
            событиям и свидетельствам времени специальной военной операции. Проект помогает
            бережно сохранять личные истории, документы и фотографии, чтобы они не терялись и
            оставались доступными для сообщества университета и будущих поколений.
          </p>
          <p>
            Страница проекта не является новостной лентой: здесь публикуются именно материалы,
            имеющие мемориальную и историческую ценность. Основная задача — собрать в одном месте
            достоверные, аккуратно оформленные свидетельства.
          </p>
        </div>

        <section className="mt-8 rounded-xl border border-[#e0d3bd] bg-[#fbf7ef] px-5 py-5 md:px-6">
          <h2 className="text-lg font-semibold text-[#3f2e1f]">Какие материалы публикуются</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-[#5d4732] md:text-base">
            <li>биографические справки и памятные тексты о людях, связанных с университетом;</li>
            <li>фотографии, подтверждённые архивные документы и сопроводительные описания;</li>
            <li>воспоминания, письма и иные материалы, важные для сохранения общей памяти.</li>
          </ul>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#e0d3bd] bg-[#fbf7ef] px-5 py-5 md:px-6">
            <h2 className="text-lg font-semibold text-[#3f2e1f]">Модерация публикаций</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#5d4732] md:text-base">
              Каждый материал проходит предварительную проверку редакцией проекта. Мы уточняем
              формулировки, корректность данных и соответствие тематике, поэтому публикация
              размещается только после модерации.
            </p>
          </div>

          <div className="rounded-xl border border-[#e0d3bd] bg-[#fbf7ef] px-5 py-5 md:px-6">
            <h2 className="text-lg font-semibold text-[#3f2e1f]">Кто может подать материал</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#5d4732] md:text-base">
              Подать информацию могут обучающиеся, сотрудники, выпускники, родственники и коллеги,
              располагающие подтверждаемыми сведениями. Если вы хотите передать материал,
              воспользуйтесь формой отправки на сайте.
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
