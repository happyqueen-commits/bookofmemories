import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
    }

    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Разрешена загрузка только изображений." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Размер изображения не должен превышать 5 МБ." }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name || "photo");
    const extension = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
    const fileName = `participants/${Date.now()}-${crypto.randomUUID()}.${extension}`;

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
