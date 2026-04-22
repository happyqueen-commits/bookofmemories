import { EntityType, SubmissionType } from "@prisma/client";

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  [EntityType.Person]: "Персона (Книга участников)",
  [EntityType.ArchiveMaterial]: "Архивный материал",
  [EntityType.Story]: "История / интервью",
  [EntityType.ChronicleEvent]: "Событие хроники"
};

const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  [SubmissionType.create]: "Создание",
  [SubmissionType.update]: "Обновление"
};

export function getEntityTypeLabel(entityType: EntityType): string {
  return ENTITY_TYPE_LABELS[entityType];
}

export function getSubmissionTypeLabel(submissionType: SubmissionType): string {
  return SUBMISSION_TYPE_LABELS[submissionType];
}

export const ENTITY_TYPE_OPTIONS = Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({
  value: value as EntityType,
  label
}));
