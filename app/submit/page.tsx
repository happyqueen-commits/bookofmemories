import { submitMaterialAction } from "@/lib/actions";
import { auth } from "@/lib/auth";

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
          Проверьте форму: заголовок должен быть не короче 2 символов, описание — не короче 3 символов.
        </p>
      )}
      <form action={submitMaterialAction} className="space-y-3 rounded border border-slate-300 bg-white p-4">
        <label className="block">Тип сущности
          <select name="targetEntityType" className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
            <option value="Person">Person</option>
            <option value="ArchiveMaterial">ArchiveMaterial</option>
            <option value="Story">Story</option>
            <option value="ChronicleEvent">ChronicleEvent</option>
          </select>
        </label>
        <label className="block">Заголовок<input name="title" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required /></label>
        <label className="block">Описание<textarea name="description" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" rows={6} required /></label>
        <button className="rounded bg-slate-800 px-4 py-2 text-white" type="submit">Отправить на модерацию</button>
      </form>
    </div>
  );
}
