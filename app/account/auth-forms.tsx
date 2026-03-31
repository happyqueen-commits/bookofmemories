"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import { loginAction, registerAction, type RegisterActionState } from "@/lib/actions";
import { passwordRequirements } from "@/lib/password-policy";

const initialRegisterState: RegisterActionState = {
  status: "idle"
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={pending}>
      {pending ? "Отправка..." : label}
    </button>
  );
}

export function AuthForms({ loginError }: { loginError?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerState, registerFormAction] = useFormState(registerAction, initialRegisterState);

  const registerErrors = registerState.errors ?? {};

  const loginErrorLabel = useMemo(() => {
    if (loginError === "empty_fields") return "Заполните email и пароль.";
    if (loginError === "invalid_credentials") return "Неверный email или пароль.";
    if (loginError === "too_many_attempts") return "Слишком много попыток входа. Попробуйте позже.";
    return "";
  }, [loginError]);

  return (
    <div className="space-y-3 rounded border border-slate-300 bg-white p-4">
      <div className="inline-flex rounded border border-slate-300 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded px-3 py-1 ${mode === "login" ? "bg-slate-800 text-white" : "text-slate-700"}`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded px-3 py-1 ${mode === "register" ? "bg-slate-800 text-white" : "text-slate-700"}`}
        >
          Регистрация
        </button>
      </div>

      {mode === "login" ? (
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
      ) : (
        <form action={registerFormAction} className="space-y-3">
          {registerState.formError ? <p className="text-sm text-red-700">{registerState.formError}</p> : null}
          {registerState.status === "success" && registerState.successMessage ? (
            <p className="text-sm text-green-700">{registerState.successMessage}</p>
          ) : null}
          <label className="block">
            Имя
            <input type="text" name="name" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
            {registerErrors.name ? <span className="text-sm text-red-700">{registerErrors.name}</span> : null}
          </label>
          <label className="block">
            Email
            <input type="email" name="email" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
            {registerErrors.email ? <span className="text-sm text-red-700">{registerErrors.email}</span> : null}
          </label>
          <label className="block">
            Пароль
            <input type="password" name="password" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
            <span className="mt-1 block text-xs text-slate-600">Требования: {passwordRequirements.join(", ")}.</span>
            {registerErrors.password ? <span className="text-sm text-red-700">{registerErrors.password}</span> : null}
          </label>
          <label className="block">
            Подтверждение пароля
            <input
              type="password"
              name="confirmPassword"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              required
            />
            {registerErrors.confirmPassword ? (
              <span className="text-sm text-red-700">{registerErrors.confirmPassword}</span>
            ) : null}
          </label>
          <SubmitButton label="Зарегистрироваться" />
        </form>
      )}
    </div>
  );
}
