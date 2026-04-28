import { getSubmissionAccessWebhookUrl } from "@/lib/env";

const SUBMISSION_ACCESS_EMAIL_WEBHOOK_URL = getSubmissionAccessWebhookUrl();

export async function deliverSubmissionAccessCode(email: string, code: string, ttlMinutes: number) {
  if (SUBMISSION_ACCESS_EMAIL_WEBHOOK_URL) {
    const response = await fetch(SUBMISSION_ACCESS_EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "submission_access_code",
        email,
        code,
        ttlMinutes
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Submission access code delivery failed: ${response.status}`);
    }

    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[submission-access] verification code generated for email=${email}, ttlMinutes=${ttlMinutes}`);
    return;
  }

  console.warn("[submission-access] No delivery channel configured in production.");
}
