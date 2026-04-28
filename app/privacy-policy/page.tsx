import { SITE_CONFIG } from "@/lib/site-config";

export const metadata = {
  title: "Политика конфиденциальности | Книга участников",
  description: "Порядок обработки и защиты персональных данных проекта «Книга участников»."
};

export default function PrivacyPolicyPage() {
  return (
    <article className="container-sm rounded-xl border border-[#ccb998] bg-[#fbf8f1] p-6 shadow-panel md:p-7">
      <h1 className="display-title text-[#483520]">Политика конфиденциальности</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#5e4a33]">
        Настоящая политика определяет порядок обработки персональных данных на сайте проекта «{SITE_CONFIG.projectName}».
        Мы собираем только сведения, необходимые для рассмотрения и публикации материалов в архиве.
      </p>

      <section className="mt-6 space-y-3 text-[#4f3b24]">
        <h2 className="subsection-title text-[#483520]">Какие данные обрабатываются</h2>
        <p>Контактные данные заявителя, текстовые материалы, фото- и документальные вложения, а также сведения о статусе заявки.</p>
      </section>

      <section className="mt-6 space-y-3 text-[#4f3b24]">
        <h2 className="subsection-title text-[#483520]">Цели обработки</h2>
        <p>Проверка достоверности материалов, связь с заявителем, модерация и публикация в открытом архиве проекта.</p>
      </section>

      <section className="mt-6 space-y-3 text-[#4f3b24]">
        <h2 className="subsection-title text-[#483520]">Обращения по вопросам данных</h2>
        <p>
          По вопросам обработки и уточнения персональных данных можно обратиться на адрес
          {" "}<a className="font-medium text-[#6f3b2f]" href={`mailto:${SITE_CONFIG.contactEmail}`}>{SITE_CONFIG.contactEmail}</a>.
        </p>
      </section>
    </article>
  );
}
