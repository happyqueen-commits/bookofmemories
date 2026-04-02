import Link from "next/link";
import { TypedSubmitForm } from "./typed-submit-form";

type SubmitPageProps = {
  searchParams?: Promise<{ success?: string; contactEmail?: string }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = (await searchParams) ?? {};
  const submittedEmail = (params.contactEmail ?? "").trim().toLowerCase();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Добавить материал</h1>
      <TypedSubmitForm />
      {submittedEmail ? (
        <p className="mt-3 text-sm text-slate-600">
          Проверить статус по email можно на странице{" "}
          <Link
            href={`/submission-status?email=${encodeURIComponent(submittedEmail)}`}
            className="underline"
          >
            статуса заявок
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
