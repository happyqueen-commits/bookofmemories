"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";

type AuthCardProps = {
  title: string;
  children: React.ReactNode;
  closeHref?: string;
};

const focusableSelectors = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(", ");

export function AuthCard({ title, children, closeHref }: AuthCardProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    document.body.classList.add("overflow-hidden");

    const focusableElements = Array.from(dialogElement.querySelectorAll<HTMLElement>(focusableSelectors));
    focusableElements[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeHref) {
        event.preventDefault();
        router.push(closeHref);
        return;
      }

      if (event.key !== "Tab") return;

      const elements = Array.from(dialogElement.querySelectorAll<HTMLElement>(focusableSelectors));
      if (!elements.length) {
        event.preventDefault();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [closeHref, router]);

  return (
    <div className="modal-overlay p-4 sm:p-6">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-surface w-full max-w-md">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 id={titleId} className="text-2xl font-semibold">
            {title}
          </h1>
          {closeHref ? (
            <Link
              href={closeHref}
              aria-label="Закрыть окно входа"
              className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            >
              ✕
            </Link>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
