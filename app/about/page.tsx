export default function AboutPage() {
  return (
    <div className="min-h-[calc(100dvh-12rem)] rounded-2xl bg-paper py-6 md:py-10">
      <article className="mx-auto max-w-3xl rounded-xl border border-[#d8ccb2] bg-[#f9f5eb] px-6 py-8 shadow-panel md:px-8 md:py-10">
        <h1 className="section-title text-[#3f2e1f]">О проекте</h1>
        <p className="mt-4 text-[#5d4732]">
          Проект сохраняет свидетельства и архивы, связанные с жизнью Финансового университета во времена СВО.
        </p>
        <p className="mt-3 text-[#5d4732]">
          Контент публикуется только после модерации, без лайков и публичных комментариев.
        </p>
      </article>
    </div>
  );
}
