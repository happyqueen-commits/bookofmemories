"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useMemo } from "react";
import { loginAction } from "@/lib/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={pending}>
      {pending ? "Отправка..." : label}
    </button>
  );
}

export function AuthForms({ loginError }: { loginError?: string }) {
  const loginErrorLabel = useMemo(() => {
    if (loginError === "empty_fields") return "Заполните email и пароль.";
    if (loginError === "invalid_credentials") return "Неверный email или пароль.";
    if (loginError === "too_many_attempts") return "Слишком много попыток входа. Попробуйте позже.";
    return "";
  }, [loginError]);

  return (
    <div className="space-y-3 rounded border border-slate-300 bg-white p-4">
      <form action={loginAction} className="space-y-3">
        {loginErrorLabel ? <p className="text-sm text-red-700">{loginErrorLabel}</p> : null}
        <label className="block">
          Email
          <input type="email" name="email" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
        </label>
        <label className="block">
          Пароль
          <input type="password" name="password" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
        </label>
        <Link href="/account/forgot-password" className="block text-sm text-slate-600 underline">
          Забыли пароль?
        </Link>
        <SubmitButton label="Войти" />
      </form>
    </div>
  );
}
