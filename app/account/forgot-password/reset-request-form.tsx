"use client";

import { useFormState, useFormStatus } from "react-dom";
import { forgotPasswordAction, type ForgotPasswordActionState } from "@/lib/actions";

const initialState: ForgotPasswordActionState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={pending}>
      {pending ? "Отправка..." : "Отправить"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useFormState(forgotPasswordAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded border border-slate-300 bg-white p-4">
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      <label className="block">
        Email
        <input type="email" name="email" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      <SubmitButton />
    </form>
  );
}
