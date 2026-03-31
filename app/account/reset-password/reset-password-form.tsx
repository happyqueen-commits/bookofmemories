"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPasswordAction, type ResetPasswordActionState } from "@/lib/actions";
import { passwordRequirements } from "@/lib/password-policy";

const initialState: ResetPasswordActionState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={pending}>
      {pending ? "Обновление..." : "Обновить пароль"}
    </button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPasswordAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded border border-slate-300 bg-white p-4">
      <input type="hidden" name="token" value={token} />
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      <label className="block">
        Новый пароль
        <input type="password" name="password" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      <label className="block">
        Подтверждение нового пароля
        <input type="password" name="confirmPassword" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      <p className="text-xs text-slate-600">Требования: {passwordRequirements.join(", ")}.</p>
      <SubmitButton />
    </form>
  );
}
