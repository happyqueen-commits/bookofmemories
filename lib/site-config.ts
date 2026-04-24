export const SITE_CONFIG = {
  projectName: "Книга участников",
  contactEmail: "info@bookofmemories.ru",
  contactLabel: "По вопросам публикации, уточнения и дополнения материалов"
} as const;

export const PUBLIC_NAV_LINKS = [
  ["/", "Главная"],
  ["/memory", "Участники"],
  ["/submit", "Добавить материал"],
  ["/submission-status", "Статус заявки"],
  ["/about", "О проекте"]
] as const;

export const SERVICE_LINKS = [
  ["/privacy-policy", "Политика конфиденциальности"],
  ["/publication-rules", "Правила публикации материалов"],
  ["/personal-data-consent", "Согласие на обработку персональных данных"]
] as const;
