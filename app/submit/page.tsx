import Link from "next/link";
import { TypedSubmitForm } from "./typed-submit-form";

type SubmitPageProps = {
  searchParams?: Promise<{ error?: string; success?: string; contactEmail?: string }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = (await searchParams) ?? {};
  const hasValidationError = params.error === "invalid_form";
  const hasSubmittedSuccess = params.success === "submitted";
  const submittedEmail = params.contactEmail;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Добавить материал</h1>
      {hasValidationError && (
        <p className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Проверьте форму: обязательные поля зависят от выбранного раздела.
        </p>
      )}
      {hasSubmittedSuccess && (
        <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <p>Материал отправлен на модерацию. После проверки он появится в соответствующем разделе.</p>
          <p className="mt-1">
            Проверить статус можно на странице {" "}
            <Link href={submittedEmail ? `/submission-status?email=${encodeURIComponent(submittedEmail)}` : "/submission-status"} className="underline">
              статуса заявок
            </Link>.
          </p>
        </div>
      )}
      <TypedSubmitForm />
    </div>
  );
}
