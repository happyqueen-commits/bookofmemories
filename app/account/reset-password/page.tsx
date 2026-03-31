import Link from "next/link";
import { ResetPasswordForm } from "@/app/account/reset-password/reset-password-form";

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams?: { token?: string };
}) {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Смена пароля</h1>
      <p className="text-sm text-slate-700">Введите новый пароль и подтверждение.</p>
      <ResetPasswordForm token={searchParams?.token ?? ""} />
      <Link href="/account" className="text-sm underline">Вернуться ко входу</Link>
    </div>
  );
}
