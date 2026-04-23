"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

export function TypedSubmitForm() {
  const searchParams = useSearchParams();
  const [entityType] = useState<EntityType>("Person");
  const errorField = searchParams.get("field");
  const errorMessage = searchParams.get("message");
  const errorLine = searchParams.get("line");
  const isInvalidForm = searchParams.get("error") === "invalid_form";
  const isSubmitted = searchParams.get("success") === "submitted";
  const hasStatusToken = Boolean(searchParams.get("statusToken"));

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    if (!isSubmitted) return;
    setDraft({ ...defaultDraft });
    setPhotoFile(null);
    setUploadedPhotoUrl("");
    setUploadError(null);
    window.localStorage.removeItem(DRAFT_KEY);
  }, [isSubmitted]);
  const fieldLabels: Record<string, string> = {
    targetEntityType: "Тип материала",
    fullName: "ФИО",
    biography: "Биография",
    shortDescription: "Краткое описание",
    birthDate: "Дата рождения",
    deathDate: "Дата смерти",
    faculty: "Факультет",
    department: "Кафедра",
    photoUrls: "Фотографии",
    uploadedPhotoUrl: "Загруженное фото",
    contactName: "Ваше имя",
    contactEmail: "Email для связи"
  };

  const getInputClass = (fieldName: string) =>
    `${baseInputClass} ${errorField === fieldName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`;

  const getFieldErrorText = (fieldName: string) => {
    if (!isInvalidForm || errorField !== fieldName) return null;
    if (fieldName === "photoUrls" && errorLine) {
      return `Ошибка в строке ${errorLine}: ${errorMessage ?? "Проверьте ссылку."}`;
    }
    return errorMessage ?? "Проверьте это поле.";
  };

  const description = useMemo(() => {
    if (entityType === "Person") return 'Данные о персоне для раздела "Книга участников". В этом MVP форма работает для Person.';
    return "";
  }, [entityType]);

  const uploadPhoto = async (file: File) => {
    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.set("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData
      });

      let json: { url?: string; error?: string } = {};
      try {
        json = (await response.json()) as { url?: string; error?: string };
      } catch {
        json = {};
      }

      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "Не удалось загрузить фото.");
      }

      setUploadedPhotoUrl(json.url);
      return json.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить фото.";
      setUploadError(message);
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!photoFile || uploadedPhotoUrl) return;

    event.preventDefault();
    const form = event.currentTarget;
    const uploadedUrl = await uploadPhoto(photoFile);
    if (!uploadedUrl) return;
    const uploadedPhotoField = form.elements.namedItem("uploadedPhotoUrl");
    if (uploadedPhotoField instanceof HTMLInputElement) {
      uploadedPhotoField.value = uploadedUrl;
    }

    const currentUrls = (draft.photoUrls ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!currentUrls.includes(uploadedUrl)) {
      setDraft((prev) => ({
        ...prev,
        photoUrls: (prev.photoUrls ?? "").trim() ? `${(prev.photoUrls ?? "").trim()}\n${uploadedUrl}` : uploadedUrl
      }));
    }

    form.requestSubmit();
  };

  return (
    <form action={submitMaterialAction} onSubmit={handleSubmit} className="space-y-4 rounded border border-slate-300 bg-white p-4">
      {isInvalidForm && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorField && fieldLabels[errorField] ? `Проверьте поле «${fieldLabels[errorField]}».` : "Проверьте форму."}
          {errorField === "photoUrls" && errorLine ? ` Ошибка в строке ${errorLine}.` : ""}
          {errorMessage ? ` ${errorMessage}` : ""}
        </p>
      )}
      {isSubmitted ? (
        <p className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Материал успешно отправлен. Форма очищена.
          {hasStatusToken ? " Ниже доступна защищенная ссылка для проверки статуса." : ""}
        </p>
      ) : null}

      <input type="hidden" name="targetEntityType" value="Person" />
      <input type="hidden" name="uploadedPhotoUrl" value={uploadedPhotoUrl} />
      <input type="hidden" name="photoUrls" value={draft.photoUrls} />
      <p className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">{description}</p>

      <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-800">Контакты для связи по заявке</p>
        <label className="block">
          Ваше имя <span className="text-slate-500">(обязательно)</span>
          <input name="contactName" className={getInputClass("contactName")} value={draft.contactName} onChange={(event) => setDraft((prev) => ({ ...prev, contactName: event.target.value }))} placeholder="Например: Анна Петрова" required />
          {getFieldErrorText("contactName") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("contactName")}</span> : null}
        </label>
        <label className="block">
          Email для связи <span className="text-slate-500">(обязательно)</span>
          <input name="contactEmail" type="email" className={getInputClass("contactEmail")} value={draft.contactEmail} onChange={(event) => setDraft((prev) => ({ ...prev, contactEmail: event.target.value }))} placeholder="Например: author@example.com" required />
          {getFieldErrorText("contactEmail") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("contactEmail")}</span> : null}
        </label>
      </div>

      <div className="space-y-3">
        <label className="block">
          ФИО <span className="text-slate-500">(обязательно)</span>
          <input name="fullName" className={getInputClass("fullName")} value={draft.fullName} onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Например: Иванов Иван Иванович" required />
          {getFieldErrorText("fullName") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("fullName")}</span> : null}
        </label>
        <label className="block">
          Биография <span className="text-slate-500">(обязательно)</span>
          <textarea name="biography" className={getInputClass("biography")} rows={6} value={draft.biography} onChange={(event) => setDraft((prev) => ({ ...prev, biography: event.target.value }))} placeholder="Например: Окончил МГТУ в 1985 году, работал на кафедре вычислительной техники, участвовал в научных проектах..." required />
          {getFieldErrorText("biography") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("biography")}</span> : null}
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            Дата рождения <span className="text-slate-500">(необязательно)</span>
            <input name="birthDate" type="date" className={getInputClass("birthDate")} value={draft.birthDate} onChange={(event) => setDraft((prev) => ({ ...prev, birthDate: event.target.value }))} />
            {getFieldErrorText("birthDate") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("birthDate")}</span> : null}
          </label>
          <label className="block">
            Дата смерти <span className="text-slate-500">(необязательно)</span>
            <input name="deathDate" type="date" className={getInputClass("deathDate")} value={draft.deathDate} onChange={(event) => setDraft((prev) => ({ ...prev, deathDate: event.target.value }))} />
            {getFieldErrorText("deathDate") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("deathDate")}</span> : null}
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            Факультет <span className="text-slate-500">(необязательно)</span>
            <input name="faculty" className={getInputClass("faculty")} value={draft.faculty} onChange={(event) => setDraft((prev) => ({ ...prev, faculty: event.target.value }))} placeholder="Например: Факультет информатики и систем управления" />
            {getFieldErrorText("faculty") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("faculty")}</span> : null}
          </label>
          <label className="block">
            Кафедра <span className="text-slate-500">(необязательно)</span>
            <input name="department" className={getInputClass("department")} value={draft.department} onChange={(event) => setDraft((prev) => ({ ...prev, department: event.target.value }))} placeholder="Например: Кафедра программного обеспечения" />
            {getFieldErrorText("department") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("department")}</span> : null}
          </label>
        </div>
        <label className="block">
          Краткое описание <span className="text-slate-500">(необязательно)</span>
          <input name="shortDescription" className={getInputClass("shortDescription")} value={draft.shortDescription} onChange={(event) => setDraft((prev) => ({ ...prev, shortDescription: event.target.value }))} placeholder="Например: Профессор кафедры, автор учебников по вычислительной математике" />
          {getFieldErrorText("shortDescription") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("shortDescription")}</span> : null}
        </label>
        <label className="mt-6 block">
          Фотофайл <span className="text-slate-500">(необязательно, до 5 МБ)</span>
          <input
            type="file"
            accept="image/*"
            className={baseInputClass}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setPhotoFile(nextFile);
              setUploadedPhotoUrl("");

              if (!nextFile) {
                setUploadError(null);
                return;
              }

              if (!nextFile.type || !nextFile.type.startsWith("image/")) {
                setUploadError("Выберите файл изображения.");
                return;
              }

              if (nextFile.size > 5 * 1024 * 1024) {
                setUploadError("Размер изображения не должен превышать 5 МБ.");
                return;
              }

              setUploadError(null);
            }}
          />
          <span className="mt-1 block text-xs text-slate-600">
            Поддерживаются распространённые форматы изображений (JPG, PNG, WEBP и другие). Фото автоматически впишется в карточку без растягивания.
          </span>
          {uploadError ? <span className="mt-1 block text-sm text-red-700">{uploadError}</span> : null}
        </label>
      </div>

      {isUploadingPhoto ? <p className="text-sm text-slate-600">Загружаем изображение…</p> : null}
      <SubmitButton />
    </form>
  );
}
