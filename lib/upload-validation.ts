const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
]);

const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

function getExt(fileName: string) {
  const clean = fileName.trim().toLowerCase();
  return clean.includes(".") ? clean.split(".").pop() ?? "" : "";
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function looksLikeImage(bytes: Uint8Array) {
  if (bytes.length < 12) return false;

  const isPng = startsWith(bytes, [0x89, 0x50, 0x4e, 0x47]);
  const isJpeg = startsWith(bytes, [0xff, 0xd8, 0xff]);
  const isGif = startsWith(bytes, [0x47, 0x49, 0x46, 0x38]);
  const isWebp = startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes.slice(8), [0x57, 0x45, 0x42, 0x50]);
  const isAvif = startsWith(bytes.slice(4), [0x66, 0x74, 0x79, 0x70]) && startsWith(bytes.slice(8), [0x61, 0x76, 0x69, 0x66]);

  return isPng || isJpeg || isGif || isWebp || isAvif;
}

export async function validateUploadImage(file: File, maxBytes: number) {
  if (file.size > maxBytes) {
    return { ok: false as const, error: "Размер изображения не должен превышать 5 МБ." };
  }

  if (!allowedMimeTypes.has(file.type)) {
    return { ok: false as const, error: "Разрешены только JPG, PNG, WEBP, GIF, AVIF." };
  }

  if (!allowedExtensions.has(getExt(file.name))) {
    return { ok: false as const, error: "Недопустимое расширение файла." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikeImage(bytes)) {
    return { ok: false as const, error: "Содержимое файла не похоже на изображение." };
  }

  return { ok: true as const };
}
