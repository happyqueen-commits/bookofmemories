import { z } from "zod";

const optionalUrl = z.string().trim().url();

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getNodeEnv() {
  return process.env.NODE_ENV === "production" ? "production" : process.env.NODE_ENV === "test" ? "test" : "development";
}

export function getDatabaseUrl() {
  return requiredEnv("DATABASE_URL");
}

export function getAuthSecret() {
  const secret = requiredEnv("AUTH_SECRET");
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters long.");
  }
  return secret;
}

export function getAppBaseUrl() {
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  if (nextAuthUrl) {
    return optionalUrl.parse(nextAuthUrl);
  }

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    return optionalUrl.parse(appUrl);
  }

  return "http://localhost:3000";
}

export function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim();
}

export function getPasswordResetWebhookUrl() {
  const value = process.env.PASSWORD_RESET_EMAIL_WEBHOOK_URL?.trim();
  return value ? optionalUrl.parse(value) : undefined;
}

export function getSubmissionAccessWebhookUrl() {
  const value = process.env.SUBMISSION_ACCESS_EMAIL_WEBHOOK_URL?.trim();
  return value ? optionalUrl.parse(value) : undefined;
}

export function getAllowedOrigins() {
  const defaults = ["localhost:3000", "127.0.0.1:3000"];
  const fromEnv = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => origin.replace(/^https?:\/\//, ""));

  const fromBase = getAppBaseUrl().replace(/^https?:\/\//, "");
  return Array.from(new Set([...defaults, fromBase, ...fromEnv]));
}
