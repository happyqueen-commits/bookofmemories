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
  const searchParams = useSearchParams();
  const initialEntityType = searchParams.get("targetEntityType");
  const [entityType, setEntityType] = useState<EntityType>(
    initialEntityType === "Person" || initialEntityType === "ArchiveMaterial" || initialEntityType === "ChronicleEvent"
      ? initialEntityType
      : "Person"
  );
  const errorField = searchParams.get("field");
  const errorMessage = searchParams.get("message");
  const isInvalidForm = searchParams.get("error") === "invalid_form";
  const getPrefillValue = (fieldName: string) => searchParams.get(fieldName) ?? "";

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
        Что вы хотите добавить <span className="text-slate-500">(обязательно)</span>
        <select
          name="targetEntityType"
          value={entityType}
          onChange={(event) => setEntityType(event.target.value as EntityType)}
          className={baseInputClass}
        >
          {ENTITY_TYPE_OPTIONS.filter((option) => option.value !== "Story").map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">{description}</p>

      {entityType === "Person" && (
        <div className="space-y-3">
          <label className="block">ФИО <span className="text-slate-500">(обязательно)</span><input name="fullName" className={getInputClass("fullName")} defaultValue={getPrefillValue("fullName")} required /></label>
          <label className="block">Биография <span className="text-slate-500">(обязательно)</span><textarea name="biography" className={getInputClass("biography")} rows={6} defaultValue={getPrefillValue("biography")} required /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Дата рождения <span className="text-slate-500">(необязательно)</span><input name="birthDate" type="date" className={getInputClass("birthDate")} defaultValue={getPrefillValue("birthDate")} /></label>
            <label className="block">Дата смерти <span className="text-slate-500">(необязательно)</span><input name="deathDate" type="date" className={getInputClass("deathDate")} defaultValue={getPrefillValue("deathDate")} /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Факультет <span className="text-slate-500">(необязательно)</span><input name="faculty" className={getInputClass("faculty")} defaultValue={getPrefillValue("faculty")} /></label>
            <label className="block">Кафедра <span className="text-slate-500">(необязательно)</span><input name="department" className={getInputClass("department")} defaultValue={getPrefillValue("department")} /></label>
          </div>
          <label className="block">Краткое описание <span className="text-slate-500">(необязательно)</span><input name="shortDescription" className={getInputClass("shortDescription")} defaultValue={getPrefillValue("shortDescription")} /></label>
        </div>
      )}

      {entityType === "ArchiveMaterial" && (
        <div className="space-y-3">
          <label className="block">Название материала <span className="text-slate-500">(обязательно)</span><input name="title" className={getInputClass("title")} defaultValue={getPrefillValue("title")} required /></label>
          <label className="block">Описание <span className="text-slate-500">(обязательно)</span><textarea name="description" className={getInputClass("description")} rows={5} defaultValue={getPrefillValue("description")} required /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Тип материала <span className="text-slate-500">(обязательно)</span><input name="materialType" className={getInputClass("materialType")} defaultValue={getPrefillValue("materialType")} required placeholder="Фото, документ, видео..." /></label>
            <label className="block">Дата события <span className="text-slate-500">(необязательно)</span><input name="eventDate" type="date" className={getInputClass("eventDate")} defaultValue={getPrefillValue("eventDate")} /></label>
          </div>
          <label className="block">Источник <span className="text-slate-500">(обязательно)</span><input name="sourceInfo" className={getInputClass("sourceInfo")} defaultValue={getPrefillValue("sourceInfo")} required /></label>
          <label className="block">Теги <span className="text-slate-500">(обязательно)</span><input name="tags" className={getInputClass("tags")} defaultValue={getPrefillValue("tags")} required placeholder="история, архив, выпускники" /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">Ссылка на файл <span className="text-slate-500">(одно из двух обязательно)</span><input name="fileUrl" type="url" className={getInputClass("fileUrl")} defaultValue={getPrefillValue("fileUrl")} placeholder="https://..." /></label>
            <label className="block">Ссылка на превью <span className="text-slate-500">(одно из двух обязательно)</span><input name="previewImageUrl" type="url" className={getInputClass("previewImageUrl")} defaultValue={getPrefillValue("previewImageUrl")} placeholder="https://..." /></label>
          </div>
          <p className="text-xs text-slate-500">* Нужно заполнить данными хотя бы одну строку со ссылкой.</p>
        </div>
      )}

      {entityType === "ChronicleEvent" && (
        <div className="space-y-3">
          <label className="block">Заголовок <span className="text-slate-500">(обязательно)</span><input name="title" className={getInputClass("title")} defaultValue={getPrefillValue("title")} required /></label>
          <label className="block">Краткая сводка <span className="text-slate-500">(обязательно)</span><textarea name="summary" className={getInputClass("summary")} rows={3} defaultValue={getPrefillValue("summary")} required /></label>
          <label className="block">Подробное описание <span className="text-slate-500">(обязательно)</span><textarea name="content" className={getInputClass("content")} rows={8} defaultValue={getPrefillValue("content")} required /></label>
          <label className="block">Дата события <span className="text-slate-500">(обязательно)</span><input name="eventDate" type="date" className={getInputClass("eventDate")} defaultValue={getPrefillValue("eventDate")} required /></label>
          <label className="block">Обложка (URL) <span className="text-slate-500">(необязательно)</span><input name="coverImageUrl" type="url" className={getInputClass("coverImageUrl")} defaultValue={getPrefillValue("coverImageUrl")} placeholder="https://..." /></label>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
