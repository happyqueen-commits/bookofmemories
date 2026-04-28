"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { PERSON_PLACEHOLDER_IMAGE, resolvePersonImageUrl } from "@/lib/placeholders";

type PersonImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
};

export function PersonImage({ src, alt, ...props }: PersonImageProps) {
  const normalizedSrc = resolvePersonImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);

  useEffect(() => {
    setCurrentSrc(normalizedSrc);
  }, [normalizedSrc]);

  return <Image {...props} src={currentSrc} alt={alt} onError={() => setCurrentSrc(PERSON_PLACEHOLDER_IMAGE)} />;
}
