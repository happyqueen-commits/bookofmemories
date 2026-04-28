"use client";

import { useTransition } from "react";
import { archivePublishedPersonAction } from "@/lib/actions";

type AdminArchiveToggleProps = {
  personId: string;
  isArchived: boolean;
};

export function AdminArchiveToggle({ personId, isArchived }: AdminArchiveToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const message = isArchived ? "Вернуть карточку в публичный каталог?" : "Скрыть карточку из публичного каталога?";
    if (!window.confirm(message)) return;

    const formData = new FormData();
    formData.set("personId", personId);
    formData.set("archive", isArchived ? "0" : "1");

    startTransition(async () => {
      await archivePublishedPersonAction(formData);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`rounded px-3 py-1 text-sm text-white disabled:opacity-70 ${isArchived ? "bg-emerald-700" : "bg-rose-700"}`}
    >
      {isArchived ? "Восстановить" : "Скрыть"}
    </button>
  );
}
