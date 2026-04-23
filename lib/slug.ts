import { prisma } from "@/lib/prisma";

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
};

export function slugify(input: string) {
  const transliterated = input
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join("");

  return transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export async function generateUniquePersonSlug(baseSource: string) {
  const base = slugify(baseSource) || "person";

  for (let index = 0; index < 6; index += 1) {
    const suffix = index === 0 ? "" : `-${uniqueSuffix()}`;
    const candidate = `${base}${suffix}`;

    const existing = await prisma.person.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString(36)}`;
}
