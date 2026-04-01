"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { EntityType } from "@prisma/client";
import { submitMaterialAction } from "@/lib/actions";
import { ENTITY_TYPE_OPTIONS } from "@/lib/entity-labels";

const baseInputClass = "mt-1 w-full rounded border border-slate-300 px-3 py-2";


function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded bg-slate-800 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Отправляем..." : "Отправить на модерацию"}
    </button>
  );
}

export function TypedSubmitForm() {
  const [entityType, setEntityType] = useState<EntityType>("Person");
  const searchParams = useSearchParams();
  const errorField = searchParams.get("field");
  const errorMessage = searchParams.get("message");
  const isInvalidForm = searchParams.get("error") === "invalid_form";

  const fieldLabels: Record<string, string> = {
    fullName: "ФИО",
    biography: "Биография",
    shortDescription: "Краткое описание",
    birthDate: "Дата рождения",
    deathDate: "Дата смерти",
    faculty: "Факультет",
    department: "Кафедра",
    title: "Заголовок / название",
    description: "Описание",
    materialType: "Тип материала",
    sourceInfo: "Источник",
    eventDate: "Дата события",
    tags: "Теги",
    fileUrl: "Ссылка на файл",
    previewImageUrl: "Ссылка на превью",
    storyType: "Тип истории",
    excerpt: "Короткое описание",
    content: "Полный текст / подробное описание",
    summary: "Краткая сводка",
    coverImageUrl: "Обложка (URL)"
  };

  const getInputClass = (fieldName: string) =>
    `${baseInputClass} ${errorField === fieldName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`;

  const description = useMemo(() => {
    if (entityType === "Person") return "Данные о персоне для раздела \"Книга памяти\".";
    if (entityType === "ArchiveMaterial") return "Архивный материал: документ, фото, публикация, ссылка.";
    if (entityType === "Story") return "История или интервью для раздела воспоминаний.";
    return "Событие для раздела хроники с датой и описанием.";
  }, [entityType]);

  return (
    <form action={submitMaterialAction} className="space-y-4 rounded border border-slate-300 bg-white p-4">
      {isInvalidForm && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage ?? "Проверьте форму."}
          {errorField && fieldLabels[errorField] ? ` Поле: ${fieldLabels[errorField]}.` : ""}
        </p>
      )}

      <label className="block">
        Что вы хотите добавить
        <select
          name="targetEntityType"
          value={entityType}
          onChange={(event) => setEntityType(event.target.value as EntityType)}
          className={baseInputClass}
        >
          {ENTITY_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">{description}</p>

      {entityType === "Person" && (
        <div className="space-y-3">
          <label className="block">ФИО *<input name="fullName" className={getInputClass("fullName")} required /></label>
          <label className="block">Биография *<textarea name="biography" className={getInputClass("biography")} rows={6} required /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Дата рождения<input name="birthDate" type="date" className={getInputClass("birthDate")} /></label>
            <label className="block">Дата смерти<input name="deathDate" type="date" className={getInputClass("deathDate")} /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Факультет<input name="faculty" className={getInputClass("faculty")} /></label>
            <label className="block">Кафедра<input name="department" className={getInputClass("department")} /></label>
          </div>
          <label className="block">Краткое описание<input name="shortDescription" className={getInputClass("shortDescription")} /></label>
        </div>
      )}

      {entityType === "ArchiveMaterial" && (
        <div className="space-y-3">
          <label className="block">Название материала *<input name="title" className={getInputClass("title")} required /></label>
          <label className="block">Описание *<textarea name="description" className={getInputClass("description")} rows={5} required /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Тип материала *<input name="materialType" className={getInputClass("materialType")} required placeholder="Фото, документ, видео..." /></label>
            <label className="block">Дата события<input name="eventDate" type="date" className={getInputClass("eventDate")} /></label>
          </div>
          <label className="block">Источник *<input name="sourceInfo" className={getInputClass("sourceInfo")} required /></label>
          <label className="block">Теги *<input name="tags" className={getInputClass("tags")} required placeholder="история, архив, выпускники" /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Ссылка на файл<input name="fileUrl" type="url" className={getInputClass("fileUrl")} placeholder="https://..." /></label>
            <label className="block">Ссылка на превью<input name="previewImageUrl" type="url" className={getInputClass("previewImageUrl")} placeholder="https://..." /></label>
          </div>
          <p className="text-xs text-slate-500">* Нужно заполнить данными хотя бы одну строку со ссылкой.</p>
        </div>
      )}

      {entityType === "Story" && (
        <div className="space-y-3">
          <label className="block">Заголовок *<input name="title" className={getInputClass("title")} required /></label>
          <label className="block">Короткое описание *<textarea name="excerpt" className={getInputClass("excerpt")} rows={3} required /></label>
          <label className="block">Полный текст *<textarea name="content" className={getInputClass("content")} rows={8} required /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Тип истории *<input name="storyType" className={getInputClass("storyType")} required placeholder="Интервью, воспоминание..." /></label>
            <label className="block">Источник<input name="sourceInfo" className={getInputClass("sourceInfo")} /></label>
          </div>
        </div>
      )}

      {entityType === "ChronicleEvent" && (
        <div className="space-y-3">
          <label className="block">Заголовок *<input name="title" className={getInputClass("title")} required /></label>
          <label className="block">Краткая сводка *<textarea name="summary" className={getInputClass("summary")} rows={3} required /></label>
          <label className="block">Подробное описание *<textarea name="content" className={getInputClass("content")} rows={8} required /></label>
          <label className="block">Дата события *<input name="eventDate" type="date" className={getInputClass("eventDate")} required /></label>
          <label className="block">Обложка (URL)<input name="coverImageUrl" type="url" className={getInputClass("coverImageUrl")} placeholder="https://..." /></label>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
