"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { submitMaterialAction } from "@/lib/actions";

const baseInputClass = "mt-1 w-full rounded border border-slate-300 px-3 py-2";
const DRAFT_KEY = "submit_person_draft_v1";
const MAX_INPUT_IMAGE_BYTES = 5 * 1024 * 1024;
const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 1500;
const OUTPUT_QUALITY = 0.88;

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

type LoadedImageSize = {
  width: number;
  height: number;
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
      className="inline-flex w-full items-center justify-center rounded-md bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Отправляем..." : "Отправить на модерацию"}
    </button>
  );
}

function fileToObjectUrl(file: File) {
  return URL.createObjectURL(file);
}

async function getImageSize(fileUrl: string): Promise<LoadedImageSize> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Не удалось прочитать изображение."));
    img.src = fileUrl;
  });
}

async function renderCroppedImage(params: {
  imageUrl: string;
  imageSize: LoadedImageSize;
  frameSize: LoadedImageSize;
  offsetX: number;
  offsetY: number;
  zoom: number;
  rotation: number;
}): Promise<File> {
  const { imageUrl, imageSize, frameSize, offsetX, offsetY, zoom, rotation } = params;
  const image = new Image();
  image.src = imageUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Не удалось подготовить изображение."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Браузер не поддерживает обработку изображений.");
  }

  const frameScale = OUTPUT_WIDTH / frameSize.width;
  const baseScale = Math.max(frameSize.width / imageSize.width, frameSize.height / imageSize.height);
  const totalScale = baseScale * zoom * frameScale;

  ctx.fillStyle = "#f8f5ef";
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  ctx.save();
  ctx.translate(OUTPUT_WIDTH / 2 + offsetX * frameScale, OUTPUT_HEIGHT / 2 + offsetY * frameScale);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(totalScale, totalScale);
  ctx.drawImage(image, -imageSize.width / 2, -imageSize.height / 2, imageSize.width, imageSize.height);
  ctx.restore();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", OUTPUT_QUALITY));
  if (!blob) {
    throw new Error("Не удалось сохранить итоговое изображение.");
  }

  return new File([blob], "person-photo.jpg", { type: "image/jpeg" });
}

export function TypedSubmitForm() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropFrameRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragBaseOffsetRef = useRef<{ x: number; y: number } | null>(null);

  const errorField = searchParams.get("field");
  const errorMessage = searchParams.get("message");
  const errorLine = searchParams.get("line");
  const isInvalidForm = searchParams.get("error") === "invalid_form";
  const isSubmitted = searchParams.get("success") === "submitted";
  const hasCodeSent = searchParams.get("codeSent") === "1";

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

  const [sourcePhotoFile, setSourcePhotoFile] = useState<File | null>(null);
  const [sourcePhotoUrl, setSourcePhotoUrl] = useState<string | null>(null);
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<LoadedImageSize | null>(null);
  const [frameSize, setFrameSize] = useState<LoadedImageSize | null>(null);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

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
    setSourcePhotoFile(null);
    setUploadedPhotoUrl("");
    setUploadError(null);
    setSourcePhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFinalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    window.localStorage.removeItem(DRAFT_KEY);
  }, [isSubmitted]);

  useEffect(() => {
    return () => {
      if (sourcePhotoUrl) URL.revokeObjectURL(sourcePhotoUrl);
      if (finalPreviewUrl) URL.revokeObjectURL(finalPreviewUrl);
    };
  }, [sourcePhotoUrl, finalPreviewUrl]);

  useEffect(() => {
    if (!cropFrameRef.current) return;

    const frame = cropFrameRef.current;
    const updateFrameSize = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width && rect.height) {
        setFrameSize({ width: rect.width, height: rect.height });
      }
    };

    updateFrameSize();
    const observer = new ResizeObserver(updateFrameSize);
    observer.observe(frame);

    return () => observer.disconnect();
  }, [isCropperOpen]);

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

  const requiredMark = <span className="ml-1 text-red-600">*</span>;

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

  const resetPhotoState = () => {
    setPhotoFile(null);
    setSourcePhotoFile(null);
    setUploadedPhotoUrl("");
    setUploadError(null);
    setImageSize(null);
    setCropOffset({ x: 0, y: 0 });
    setCropRotation(0);
    setCropZoom(1);
    setIsCropperOpen(false);
    setSourcePhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFinalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNewFile = async (nextFile: File | null) => {
    setUploadedPhotoUrl("");

    if (!nextFile) {
      resetPhotoState();
      return;
    }

    if (!nextFile.type || !nextFile.type.startsWith("image/")) {
      setUploadError("Выберите файл изображения.");
      return;
    }

    if (nextFile.size > MAX_INPUT_IMAGE_BYTES) {
      setUploadError("Размер изображения не должен превышать 5 МБ.");
      return;
    }

    const nextSourceUrl = fileToObjectUrl(nextFile);

    try {
      const nextImageSize = await getImageSize(nextSourceUrl);
      setUploadError(null);
      setSourcePhotoFile(nextFile);
      setPhotoFile(null);
      setImageSize(nextImageSize);
      setCropOffset({ x: 0, y: 0 });
      setCropRotation(0);
      setCropZoom(1);
      setSourcePhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextSourceUrl;
      });
      setFinalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setIsCropperOpen(true);
    } catch (error) {
      URL.revokeObjectURL(nextSourceUrl);
      setUploadError(error instanceof Error ? error.message : "Не удалось открыть изображение.");
    }
  };

  const handleCropConfirm = async () => {
    if (!sourcePhotoUrl || !imageSize || !frameSize) {
      setUploadError("Не удалось подготовить изображение к кадрированию.");
      return;
    }

    setIsProcessingCrop(true);
    setUploadError(null);
    try {
      const processedFile = await renderCroppedImage({
        imageUrl: sourcePhotoUrl,
        imageSize,
        frameSize,
        offsetX: cropOffset.x,
        offsetY: cropOffset.y,
        zoom: cropZoom,
        rotation: cropRotation
      });

      const nextPreviewUrl = fileToObjectUrl(processedFile);
      setPhotoFile(processedFile);
      setUploadedPhotoUrl("");
      setFinalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextPreviewUrl;
      });
      setIsCropperOpen(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Не удалось обработать изображение.");
    } finally {
      setIsProcessingCrop(false);
    }
  };

  const handleCropDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isCropperOpen) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    dragBaseOffsetRef.current = { ...cropOffset };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCropDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !dragBaseOffsetRef.current) return;
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    setCropOffset({ x: dragBaseOffsetRef.current.x + deltaX, y: dragBaseOffsetRef.current.y + deltaY });
  };

  const handleCropDragEnd = () => {
    dragStartRef.current = null;
    dragBaseOffsetRef.current = null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (sourcePhotoFile && !photoFile) {
      event.preventDefault();
      setUploadError("Подтвердите кадрирование изображения перед отправкой формы.");
      setIsCropperOpen(true);
      return;
    }

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

  const canRenderCropper = Boolean(sourcePhotoUrl && imageSize && frameSize);
  const cropBaseScale = imageSize && frameSize ? Math.max(frameSize.width / imageSize.width, frameSize.height / imageSize.height) : 1;

  return (
    <form
      action={submitMaterialAction}
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"
    >
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
          {hasCodeSent ? " Мы отправили код подтверждения на указанный email." : ""}
        </p>
      ) : null}

      <input type="hidden" name="targetEntityType" value="Person" />
      <input type="hidden" name="uploadedPhotoUrl" value={uploadedPhotoUrl} />
      <input type="hidden" name="photoUrls" value={draft.photoUrls} />
      <input type="text" name="website" autoComplete="off" tabIndex={-1} aria-hidden="true" className="hidden" />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm leading-relaxed text-slate-700">
          Заполните форму, чтобы предложить материал для публикации в разделе «Книга участников». После отправки заявка
          поступит на модерацию, а статус можно будет проверить через письмо с кодом подтверждения.
        </p>
        <p className="text-xs text-slate-500">
          Поля, отмеченные <span className="text-red-600">*</span>, обязательны для заполнения.
        </p>
      </div>

      <section className="space-y-4 border-b border-slate-200 pb-6">
        <h2 className="text-lg font-semibold text-slate-900">Контакты для связи</h2>
        <label className="block">
          <span className="font-medium text-slate-800">
            Ваше имя
            {requiredMark}
          </span>
          <input name="contactName" className={getInputClass("contactName")} value={draft.contactName} onChange={(event) => setDraft((prev) => ({ ...prev, contactName: event.target.value }))} placeholder="Например: Анна Петрова" required />
          {getFieldErrorText("contactName") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("contactName")}</span> : null}
        </label>
        <label className="block">
          <span className="font-medium text-slate-800">
            Email для связи
            {requiredMark}
          </span>
          <input name="contactEmail" type="email" className={getInputClass("contactEmail")} value={draft.contactEmail} onChange={(event) => setDraft((prev) => ({ ...prev, contactEmail: event.target.value }))} placeholder="Например: author@example.com" required />
          {getFieldErrorText("contactEmail") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("contactEmail")}</span> : null}
        </label>
      </section>

      <section className="space-y-4 border-b border-slate-200 pb-6">
        <h2 className="text-lg font-semibold text-slate-900">Сведения о человеке</h2>
        <label className="block">
          <span className="font-medium text-slate-800">
            ФИО
            {requiredMark}
          </span>
          <input name="fullName" className={getInputClass("fullName")} value={draft.fullName} onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Например: Иванов Иван Иванович" required />
          {getFieldErrorText("fullName") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("fullName")}</span> : null}
        </label>
        <label className="block">
          <span className="font-medium text-slate-800">
            Биография
            {requiredMark}
          </span>
          <textarea name="biography" className={getInputClass("biography")} rows={6} value={draft.biography} onChange={(event) => setDraft((prev) => ({ ...prev, biography: event.target.value }))} placeholder="Например: Окончил МГТУ в 1985 году, работал на кафедре вычислительной техники, участвовал в научных проектах..." required />
          {getFieldErrorText("biography") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("biography")}</span> : null}
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="font-medium text-slate-800">Дата рождения</span>
            <input name="birthDate" type="date" className={getInputClass("birthDate")} value={draft.birthDate} onChange={(event) => setDraft((prev) => ({ ...prev, birthDate: event.target.value }))} />
            {getFieldErrorText("birthDate") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("birthDate")}</span> : null}
          </label>
          <label className="block">
            <span className="font-medium text-slate-800">Дата смерти</span>
            <input name="deathDate" type="date" className={getInputClass("deathDate")} value={draft.deathDate} onChange={(event) => setDraft((prev) => ({ ...prev, deathDate: event.target.value }))} />
            {getFieldErrorText("deathDate") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("deathDate")}</span> : null}
          </label>
        </div>
      </section>

      <section className="space-y-4 border-b border-slate-200 pb-6">
        <h2 className="text-lg font-semibold text-slate-900">Дополнительные сведения</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="font-medium text-slate-800">Факультет</span>
            <input name="faculty" className={getInputClass("faculty")} value={draft.faculty} onChange={(event) => setDraft((prev) => ({ ...prev, faculty: event.target.value }))} placeholder="Например: Факультет информатики и систем управления" />
            {getFieldErrorText("faculty") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("faculty")}</span> : null}
          </label>
          <label className="block">
            <span className="font-medium text-slate-800">Кафедра</span>
            <input name="department" className={getInputClass("department")} value={draft.department} onChange={(event) => setDraft((prev) => ({ ...prev, department: event.target.value }))} placeholder="Например: Кафедра программного обеспечения" />
            {getFieldErrorText("department") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("department")}</span> : null}
          </label>
        </div>
        <label className="block">
          <span className="font-medium text-slate-800">Краткое описание</span>
          <input name="shortDescription" className={getInputClass("shortDescription")} value={draft.shortDescription} onChange={(event) => setDraft((prev) => ({ ...prev, shortDescription: event.target.value }))} placeholder="Например: Профессор кафедры, автор учебников по вычислительной математике" />
          {getFieldErrorText("shortDescription") ? <span className="mt-1 block text-sm text-red-700">{getFieldErrorText("shortDescription")}</span> : null}
        </label>
      </section>

      <section className="space-y-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Фотография</h2>
          <p className="mt-1 text-sm text-slate-600">Загрузите фото человека для карточки. Поддерживаются изображения до 5 МБ.</p>
        </div>

        <label className="block rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="font-medium text-slate-800">Выберите изображение</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={`${baseInputClass} bg-white`}
            onChange={(event) => {
              void handleNewFile(event.target.files?.[0] ?? null);
            }}
          />
          <span className="mt-2 block text-xs leading-relaxed text-slate-600">
            Как подготовить фото: 1) загрузите файл, 2) разместите изображение в рамке 4:5, 3) подтвердите кадрирование и
            проверьте итоговое превью.
          </span>
          {uploadError ? <span className="mt-1 block text-sm text-red-700">{uploadError}</span> : null}
        </label>

        {isCropperOpen && sourcePhotoUrl ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-sm font-medium text-slate-800">Подгоните изображение под формат карточки</p>
            <p className="mt-1 text-xs text-slate-600">Переместите и увеличьте фото так, как оно должно отображаться в карточке.</p>

            <div
              ref={cropFrameRef}
              className="relative mt-3 aspect-[4/5] w-full max-w-sm touch-none overflow-hidden rounded-lg border border-slate-300 bg-slate-100"
              onPointerDown={handleCropDragStart}
              onPointerMove={handleCropDragMove}
              onPointerUp={handleCropDragEnd}
              onPointerCancel={handleCropDragEnd}
            >
              {canRenderCropper ? (
                <img
                  src={sourcePhotoUrl}
                  alt="Предпросмотр кадрирования"
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: `${imageSize?.width ?? 0}px`,
                    height: `${imageSize?.height ?? 0}px`,
                    transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) rotate(${cropRotation}deg) scale(${cropBaseScale * cropZoom})`,
                    transformOrigin: "center"
                  }}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 border-[3px] border-white/80 shadow-[inset_0_0_0_9999px_rgba(15,23,42,0.3)]" />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">
                Масштаб: {cropZoom.toFixed(2)}x
                <input type="range" min={1} max={3} step={0.01} className="mt-1 w-full" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} />
              </label>
              <label className="text-sm text-slate-700">
                Поворот: {cropRotation}°
                <input type="range" min={-45} max={45} step={1} className="mt-1 w-full" value={cropRotation} onChange={(event) => setCropRotation(Number(event.target.value))} />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={handleCropConfirm} disabled={isProcessingCrop || !frameSize} className="rounded bg-slate-800 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70">
                {isProcessingCrop ? "Обрабатываем..." : "Подтвердить кадрирование"}
              </button>
              <button type="button" onClick={() => setIsCropperOpen(false)} className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700">
                Скрыть редактор
              </button>
              <button type="button" onClick={resetPhotoState} className="rounded border border-red-200 px-3 py-2 text-sm text-red-700">
                Удалить изображение
              </button>
            </div>
          </div>
        ) : null}

        {finalPreviewUrl ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-medium text-emerald-900">Итоговое изображение для отправки</p>
            <div className="mt-2 w-full max-w-[220px] overflow-hidden rounded-lg border border-emerald-200 bg-white">
              <img src={finalPreviewUrl} alt="Итоговое превью" className="aspect-[4/5] h-auto w-full object-cover" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setIsCropperOpen(true)} className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700">
                Изменить кадрирование
              </button>
              <button type="button" onClick={resetPhotoState} className="rounded border border-red-200 px-3 py-2 text-sm text-red-700">
                Удалить изображение
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Отправка заявки</h2>
        <p className="text-sm text-slate-600">
          После отправки заявка будет передана на модерацию. Мы отправим код подтверждения на указанный email, чтобы вы могли
          отслеживать статус.
        </p>
        {isUploadingPhoto ? <p className="text-sm text-slate-600">Загружаем изображение…</p> : null}
        <SubmitButton />
      </section>
    </form>
  );
}
