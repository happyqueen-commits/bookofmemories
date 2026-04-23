import Link from "next/link";
import { TypedSubmitForm } from "./typed-submit-form";

type SubmitPageProps = {
  searchParams?: Promise<{ success?: string; statusToken?: string }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = (await searchParams) ?? {};
  const statusToken = (params.statusToken ?? "").trim();
  const statusLink = statusToken ? `/submission-status?token=${encodeURIComponent(statusToken)}` : "";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Добавить материал</h1>
      <TypedSubmitForm />
      {statusToken ? (
        <p className="mt-3 text-sm text-slate-600">
          Для проверки статуса используйте персональную ссылку (сохраните ее в надежном месте):{" "}
          <Link
            href={statusLink}
            className="underline"
          >
            открыть страницу статуса
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
