import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { checkPublicRateLimit } from "@/lib/public-rate-limit";
import { getClientIpFromHeaders } from "@/lib/login-rate-limit";
import { validateUploadImage } from "@/lib/upload-validation";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
    const ip = getClientIpFromHeaders(request.headers);
    const rateLimit = await checkPublicRateLimit(ip, "upload");

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Слишком много загрузок с этого IP. Повторите позже." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Сервис загрузки временно недоступен: не настроен BLOB_READ_WRITE_TOKEN. Добавьте ссылку в поле URL фото или обратитесь к администратору."
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
    }

    const validation = await validateUploadImage(file, MAX_IMAGE_SIZE_BYTES);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name || "photo");
    const extension = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
    const fileName = `participants/${crypto.randomUUID()}.${extension}`;

    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[upload] failed to upload image", error);
    return NextResponse.json({ error: "Не удалось загрузить изображение." }, { status: 500 });
  }
}
