"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
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

  const description = useMemo(() => {
    if (entityType === "Person") return "Данные о персоне для раздела \"Книга памяти\".";
    if (entityType === "ArchiveMaterial") return "Архивный материал: документ, фото, публикация, ссылка.";
    if (entityType === "Story") return "История или интервью для раздела воспоминаний.";
    return "Событие для раздела хроники с датой и описанием.";
  }, [entityType]);

  return (
    <form action={submitMaterialAction} className="space-y-4 rounded border border-slate-300 bg-white p-4">
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
          <label className="block">ФИО *<input name="fullName" className={baseInputClass} required /></label>
          <label className="block">Биография *<textarea name="biography" className={baseInputClass} rows={6} required /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Дата рождения<input name="birthDate" type="date" className={baseInputClass} /></label>
            <label className="block">Дата смерти<input name="deathDate" type="date" className={baseInputClass} /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Факультет<input name="faculty" className={baseInputClass} /></label>
            <label className="block">Кафедра<input name="department" className={baseInputClass} /></label>
          </div>
          <label className="block">Краткое описание<input name="shortDescription" className={baseInputClass} /></label>
        </div>
      )}

      {entityType === "ArchiveMaterial" && (
        <div className="space-y-3">
          <label className="block">Название материала *<input name="title" className={baseInputClass} required /></label>
          <label className="block">Описание *<textarea name="description" className={baseInputClass} rows={5} required /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Тип материала *<input name="materialType" className={baseInputClass} required placeholder="Фото, документ, видео..." /></label>
            <label className="block">Дата события<input name="eventDate" type="date" className={baseInputClass} /></label>
          </div>
          <label className="block">Источник *<input name="sourceInfo" className={baseInputClass} required /></label>
          <label className="block">Теги *<input name="tags" className={baseInputClass} required placeholder="история, архив, выпускники" /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Ссылка на файл<input name="fileUrl" type="url" className={baseInputClass} placeholder="https://..." /></label>
            <label className="block">Ссылка на превью<input name="previewImageUrl" type="url" className={baseInputClass} placeholder="https://..." /></label>
          </div>
          <p className="text-xs text-slate-500">* Нужно указать хотя бы одну ссылку: fileUrl или previewImageUrl.</p>
        </div>
      )}

      {entityType === "Story" && (
        <div className="space-y-3">
          <label className="block">Заголовок *<input name="title" className={baseInputClass} required /></label>
          <label className="block">Короткое описание *<textarea name="excerpt" className={baseInputClass} rows={3} required /></label>
          <label className="block">Полный текст *<textarea name="content" className={baseInputClass} rows={8} required /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Тип истории *<input name="storyType" className={baseInputClass} required placeholder="Интервью, воспоминание..." /></label>
            <label className="block">Источник<input name="sourceInfo" className={baseInputClass} /></label>
          </div>
        </div>
      )}

      {entityType === "ChronicleEvent" && (
        <div className="space-y-3">
          <label className="block">Заголовок *<input name="title" className={baseInputClass} required /></label>
          <label className="block">Краткая сводка *<textarea name="summary" className={baseInputClass} rows={3} required /></label>
          <label className="block">Подробное описание *<textarea name="content" className={baseInputClass} rows={8} required /></label>
          <label className="block">Дата события *<input name="eventDate" type="date" className={baseInputClass} required /></label>
          <label className="block">Обложка (URL)<input name="coverImageUrl" type="url" className={baseInputClass} placeholder="https://..." /></label>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
