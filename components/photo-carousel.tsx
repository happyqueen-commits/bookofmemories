"use client";

import Image from "next/image";
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
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[#ccb18b] bg-[#f3ead9] p-2 shadow-sm">
        <div className="relative flex h-[360px] w-full items-center justify-center overflow-hidden rounded-lg bg-[#efe4d1] sm:h-[420px] lg:h-[480px]">
          <Image src={photos[index]} alt={alt} fill className="object-contain" sizes="(max-width: 1024px) 100vw, 40vw" />
        </div>
      </div>
      {hasMany ? (
        <div className="flex items-center justify-between rounded-lg border border-[#d4c2a4] bg-[#fffaf0] px-3 py-2 text-sm text-[#5a4630]">
          <button type="button" onClick={prev} className="rounded-md border border-[#bda27b] bg-[#fffdf7] px-3 py-1 text-[#4c3923] transition-colors hover:bg-[#f5ebd8]">
            ← Назад
          </button>
          <p className="font-medium">
            Фото {index + 1} из {photos.length}
          </p>
          <button type="button" onClick={next} className="rounded-md border border-[#bda27b] bg-[#fffdf7] px-3 py-1 text-[#4c3923] transition-colors hover:bg-[#f5ebd8]">
            Вперёд →
          </button>
        </div>
      ) : null}
    </div>
  );
}
