"use client";

import { useState } from "react";

type PhotoCarouselProps = {
  photos: string[];
  alt: string;
};

export function PhotoCarousel({ photos, alt }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const hasMany = photos.length > 1;

  const prev = () => setIndex((current) => (current - 1 + photos.length) % photos.length);
  const next = () => setIndex((current) => (current + 1) % photos.length);

  return (
    <div className="space-y-2">
      <img src={photos[index]} alt={alt} className="h-72 w-full rounded-sm border border-[#cfbea0] object-cover" />
      {hasMany ? (
        <div className="flex items-center justify-between rounded border border-[#cfbea0] bg-[#fffdf7] px-3 py-2 text-sm">
          <button type="button" onClick={prev} className="rounded border border-slate-300 px-3 py-1">
            ← Назад
          </button>
          <p>
            Фото {index + 1} из {photos.length}
          </p>
          <button type="button" onClick={next} className="rounded border border-slate-300 px-3 py-1">
            Вперёд →
          </button>
        </div>
      ) : null}
    </div>
  );
}
