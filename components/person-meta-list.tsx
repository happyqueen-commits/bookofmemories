import type { ReactNode } from "react";

type MetaValue = string | number | null | undefined;

type MetadataItemProps = {
  label: string;
  value: MetaValue;
  className?: string;
};

function normalizeValue(value: MetaValue): string | null {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  return normalized;
}

export function MetadataItem({ label, value, className }: MetadataItemProps) {
  const normalized = normalizeValue(value);
  if (!normalized) return null;

  return <p className={className}>{label}: {normalized}</p>;
}

type PersonMetaListProps = {
  className?: string;
  children: ReactNode;
};

export function PersonMetaList({ className, children }: PersonMetaListProps) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  if (items.length === 0) return null;

  return <div className={className}>{items}</div>;
}
