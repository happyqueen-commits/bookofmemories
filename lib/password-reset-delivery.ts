const PASSWORD_RESET_EMAIL_WEBHOOK_URL = process.env.PASSWORD_RESET_EMAIL_WEBHOOK_URL;

export async function deliverPasswordResetToken(email: string, rawToken: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/account/forgot-password/reset?token=${encodeURIComponent(rawToken)}`;

  if (PASSWORD_RESET_EMAIL_WEBHOOK_URL) {
    const response = await fetch(PASSWORD_RESET_EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "password_reset",
        email,
        resetUrl,
        token: rawToken
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Password reset delivery failed: ${response.status}`);
    }

    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // Internal QA channel: server-side log only (not exposed to UI).
    console.info(`[password-reset][internal-qa] email=${email} token=${rawToken} resetUrl=${resetUrl}`);
    return;
  }

  console.warn("[password-reset] No delivery channel configured in production.");
}
