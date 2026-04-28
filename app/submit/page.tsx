import Link from "next/link";
import { TypedSubmitForm } from "./typed-submit-form";

type SubmitPageProps = {
  searchParams?: Promise<{ success?: string; codeSent?: string; email?: string }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = (await searchParams) ?? {};
  const codeSent = params.codeSent === "1";
  const email = (params.email ?? "").trim().toLowerCase();
  const statusLink = email ? `/submission-status?email=${encodeURIComponent(email)}` : "/submission-status";

  return (
    <div className="container-md page-shell-tight">
      <h1 className="mb-5 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Добавить материал</h1>
      <TypedSubmitForm />
      {codeSent ? (
        <p className="mt-3 text-sm text-slate-600">
          Мы отправили код подтверждения на вашу почту. Введите email и код, чтобы подтвердить заявку и посмотреть ее статус:{" "}
          <Link
            href={statusLink}
            className="underline"
          >
            перейти к проверке статуса
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
