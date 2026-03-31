import Link from "next/link";
import { ForgotPasswordForm } from "@/app/account/forgot-password/reset-request-form";

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Восстановление пароля</h1>
      <p className="text-sm text-slate-700">
        Укажите email. Если аккаунт существует, мы отправим инструкцию по восстановлению.
      </p>
      <ForgotPasswordForm />
      <Link href="/account" className="text-sm underline">Вернуться ко входу</Link>
    </div>
  );
}
