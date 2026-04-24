import { getAppBaseUrl, getPasswordResetWebhookUrl } from "@/lib/env";

const PASSWORD_RESET_EMAIL_WEBHOOK_URL = getPasswordResetWebhookUrl();

export async function deliverPasswordResetToken(email: string, rawToken: string) {
  const baseUrl = getAppBaseUrl();
  const resetUrl = new URL("/account/reset-password", baseUrl);
  resetUrl.searchParams.set("token", rawToken);

  if (PASSWORD_RESET_EMAIL_WEBHOOK_URL) {
    const response = await fetch(PASSWORD_RESET_EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "password_reset",
        email,
        resetUrl: resetUrl.toString()
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Password reset delivery failed: ${response.status}`);
    }

    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[password-reset][internal-qa] email=${email} resetUrl=${resetUrl.toString()}`);
    return;
  }

  console.warn("[password-reset] No delivery channel configured in production.");
}
