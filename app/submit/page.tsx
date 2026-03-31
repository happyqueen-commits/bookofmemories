import { auth } from "@/lib/auth";
import { TypedSubmitForm } from "./typed-submit-form";

type SubmitPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const session = await auth();
  const params = (await searchParams) ?? {};
  const hasValidationError = params.error === "invalid_form";

  if (!session?.user) {
    return <div><h1 className="text-2xl font-semibold">Добавить материал</h1><p className="mt-2">Чтобы отправить заявку, войдите в кабинет автора.</p></div>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Добавить материал</h1>
      {hasValidationError && (
        <p className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Проверьте форму: обязательные поля зависят от выбранного типа сущности.
        </p>
      )}
      <TypedSubmitForm />
    </div>
  );
}
