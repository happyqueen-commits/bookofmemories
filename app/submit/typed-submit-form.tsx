"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { EntityType } from "@prisma/client";
import { submitMaterialAction } from "@/lib/actions";

const baseInputClass = "mt-1 w-full rounded border border-slate-300 px-3 py-2";
const DRAFT_KEY = "submit_person_draft_v1";

type DraftState = {
  contactName: string;
  contactEmail: string;
  fullName: string;
  biography: string;
  birthDate: string;
  deathDate: string;
  faculty: string;
  department: string;
  shortDescription: string;
  photoUrls: string;
};

const defaultDraft: DraftState = {
  contactName: "",
  contactEmail: "",
  fullName: "",
  biography: "",
  birthDate: "",
  deathDate: "",
  faculty: "",
  department: "",
  shortDescription: "",
  photoUrls: ""
};

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

type TypedSubmitFormProps = {
  editableSubmission?: {
    id: string;
    contactEmail: string;
    contactName: string;
    payload: Record<string, unknown>;
  };
};

export function TypedSubmitForm({ editableSubmission }: TypedSubmitFormProps) {
  const searchParams = useSearchParams();
  const [entityType] = useState<EntityType>("Person");
  const errorField = searchParams.get("field");
  const errorMessage = searchParams.get("message");
  const isInvalidForm = searchParams.get("error") === "invalid_form";
  const isSubmitted = searchParams.get("success") === "submitted";

  const queryDraft: Partial<DraftState> = {
    contactName: searchParams.get("contactName") ?? undefined,
    contactEmail: searchParams.get("contactEmail") ?? undefined,
    fullName: searchParams.get("fullName") ?? undefined,
    biography: searchParams.get("biography") ?? undefined,
    birthDate: searchParams.get("birthDate") ?? undefined,
    deathDate: searchParams.get("deathDate") ?? undefined,
    faculty: searchParams.get("faculty") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    shortDescription: searchParams.get("shortDescription") ?? undefined,
    photoUrls: searchParams.get("photoUrls") ?? undefined
  };

  const [draft, setDraft] = useState<DraftState>({ ...defaultDraft, ...queryDraft });

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const localDraft = JSON.parse(raw) as Partial<DraftState>;
      setDraft((prev) => ({ ...prev, ...localDraft, ...queryDraft }));
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    if (!editableSubmission) return;
    const payload = editableSubmission.payload;
    const photoUrls = Array.isArray(payload.photoUrls)
      ? payload.photoUrls.filter((item): item is string => typeof item === "string").join("\n")
      : "";

    setDraft((prev) => ({
      ...prev,
      contactEmail: editableSubmission.contactEmail,
      contactName: editableSubmission.contactName,
      fullName: typeof payload.fullName === "string" ? payload.fullName : prev.fullName,
      biography: typeof payload.biography === "string" ? payload.biography : prev.biography,
      birthDate: typeof payload.birthDate === "string" ? payload.birthDate.slice(0, 10) : prev.birthDate,
      deathDate: typeof payload.deathDate === "string" ? payload.deathDate.slice(0, 10) : prev.deathDate,
      faculty: typeof payload.faculty === "string" ? payload.faculty : prev.faculty,
      department: typeof payload.department === "string" ? payload.department : prev.department,
      shortDescription: typeof payload.shortDescription === "string" ? payload.shortDescription : prev.shortDescription,
      photoUrls
    }));
  }, [editableSubmission]);

  const fieldLabels: Record<string, string> = {
    fullName: "ФИО",
    biography: "Биография",
    shortDescription: "Краткое описание",
    birthDate: "Дата рождения",
    deathDate: "Дата смерти",
    faculty: "Факультет",
    department: "Кафедра",
    photoUrls: "Фотографии",
    contactName: "Ваше имя",
    contactEmail: "Email для связи"
  };

  const getInputClass = (fieldName: string) =>
    `${baseInputClass} ${errorField === fieldName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`;

  const description = useMemo(() => {
    if (entityType === "Person") return 'Данные о персоне для раздела "Книга памяти".';
    return "";
  }, [entityType]);

  return (
    <form action={submitMaterialAction} className="space-y-4 rounded border border-slate-300 bg-white p-4">
      {isInvalidForm && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage ?? "Проверьте форму."}
          {errorField && fieldLabels[errorField] ? ` Поле: ${fieldLabels[errorField]}.` : ""}
        </p>
      )}
      {isSubmitted ? (
        <p className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Материал отправлен. Содержимое формы сохранено, вы можете продолжить редактирование при необходимости.
        </p>
      ) : null}

      <input type="hidden" name="targetEntityType" value="Person" />
      {editableSubmission ? <input type="hidden" name="submissionId" value={editableSubmission.id} /> : null}
      <p className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">{description}</p>

      <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-800">Контакты для связи по заявке</p>
        <label className="block">Ваше имя <span className="text-slate-500">(обязательно)</span><input name="contactName" className={getInputClass("contactName")} value={draft.contactName} onChange={(event) => setDraft((prev) => ({ ...prev, contactName: event.target.value }))} required /></label>
        <label className="block">Email для связи <span className="text-slate-500">(обязательно)</span><input name="contactEmail" type="email" className={getInputClass("contactEmail")} value={draft.contactEmail} onChange={(event) => setDraft((prev) => ({ ...prev, contactEmail: event.target.value }))} required /></label>
      </div>

      <div className="space-y-3">
        <label className="block">ФИО <span className="text-slate-500">(обязательно)</span><input name="fullName" className={getInputClass("fullName")} value={draft.fullName} onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))} required /></label>
        <label className="block">Биография <span className="text-slate-500">(обязательно)</span><textarea name="biography" className={getInputClass("biography")} rows={6} value={draft.biography} onChange={(event) => setDraft((prev) => ({ ...prev, biography: event.target.value }))} required /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">Дата рождения <span className="text-slate-500">(необязательно)</span><input name="birthDate" type="date" className={getInputClass("birthDate")} value={draft.birthDate} onChange={(event) => setDraft((prev) => ({ ...prev, birthDate: event.target.value }))} /></label>
          <label className="block">Дата смерти <span className="text-slate-500">(необязательно)</span><input name="deathDate" type="date" className={getInputClass("deathDate")} value={draft.deathDate} onChange={(event) => setDraft((prev) => ({ ...prev, deathDate: event.target.value }))} /></label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">Факультет <span className="text-slate-500">(необязательно)</span><input name="faculty" className={getInputClass("faculty")} value={draft.faculty} onChange={(event) => setDraft((prev) => ({ ...prev, faculty: event.target.value }))} /></label>
          <label className="block">Кафедра <span className="text-slate-500">(необязательно)</span><input name="department" className={getInputClass("department")} value={draft.department} onChange={(event) => setDraft((prev) => ({ ...prev, department: event.target.value }))} /></label>
        </div>
        <label className="block">Краткое описание <span className="text-slate-500">(необязательно)</span><input name="shortDescription" className={getInputClass("shortDescription")} value={draft.shortDescription} onChange={(event) => setDraft((prev) => ({ ...prev, shortDescription: event.target.value }))} /></label>
        <label className="block">
          Фото (URL, каждая ссылка с новой строки) <span className="text-slate-500">(необязательно)</span>
          <textarea name="photoUrls" className={getInputClass("photoUrls")} rows={4} value={draft.photoUrls} onChange={(event) => setDraft((prev) => ({ ...prev, photoUrls: event.target.value }))} placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg" />
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}
