export const PERSON_PLACEHOLDER_IMAGE = "/images/placeholders/person-military-placeholder.svg";

export function resolvePersonImageUrl(imageUrl?: string | null) {
  const trimmed = imageUrl?.trim();
  return trimmed ? trimmed : PERSON_PLACEHOLDER_IMAGE;
}

export function getPersonImageAlt(fullName?: string | null, imageUrl?: string | null) {
  if (imageUrl?.trim()) {
    return fullName?.trim() ? `Фото: ${fullName}` : "Фото участника";
  }

  return "Изображение-заглушка для карточки участника";
}
