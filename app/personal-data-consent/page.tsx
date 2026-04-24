import { SITE_CONFIG } from "@/lib/site-config";

export const metadata = {
  title: "Согласие на обработку персональных данных | Книга участников",
  description: "Информация о согласии на обработку персональных данных при подаче материалов."
};

export default function PersonalDataConsentPage() {
  return (
    <article className="mx-auto max-w-4xl rounded-xl border border-[#ccb998] bg-[#fbf8f1] p-6 shadow-panel md:p-8">
      <h1 className="display-title text-[#483520]">Согласие на обработку персональных данных</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#5e4a33]">
        Отправляя материалы через формы сайта, пользователь подтверждает согласие на обработку персональных данных в объёме,
        необходимом для модерации, связи и публикации в проекте «{SITE_CONFIG.projectName}».
      </p>

      <section className="mt-6 space-y-3 text-[#4f3b24]">
        <h2 className="subsection-title text-[#483520]">Срок действия согласия</h2>
        <p>Согласие действует до достижения целей обработки либо до поступления отзыва от пользователя.</p>
      </section>

      <section className="mt-6 space-y-3 text-[#4f3b24]">
        <h2 className="subsection-title text-[#483520]">Как отозвать согласие</h2>
        <p>
          Отзыв можно направить по электронной почте
          {" "}<a className="font-medium text-[#6f3b2f]" href={`mailto:${SITE_CONFIG.contactEmail}`}>{SITE_CONFIG.contactEmail}</a>
          {" "}с указанием данных, позволяющих идентифицировать обращение.
        </p>
      </section>
    </article>
  );
}
