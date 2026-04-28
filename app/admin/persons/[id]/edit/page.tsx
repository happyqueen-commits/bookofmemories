export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModerationStatus, Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { updatePublishedPersonAction } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-3 py-2";

function formatDateForInput(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function EditPersonPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN)) {
    notFound();
  }

  const { id } = await params;
  const query = (await searchParams) ?? {};

  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Редактирование карточки</h1>
        <Link href="/admin" className="text-sm text-slate-600 underline">Вернуться в админку</Link>
      </div>

      {query.error ? <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{query.error}</p> : null}

      <form action={updatePublishedPersonAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="personId" value={person.id} />

        <label className="block">
          <span className="font-medium text-slate-800">ФИО</span>
          <input name="fullName" defaultValue={person.fullName} className={inputClass} required />
        </label>

        <label className="block">
          <span className="font-medium text-slate-800">Биография</span>
          <textarea name="biography" defaultValue={person.biography} rows={7} className={inputClass} required />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="font-medium text-slate-800">Дата рождения</span>
            <input type="date" name="birthDate" defaultValue={formatDateForInput(person.birthDate)} className={inputClass} />
          </label>
          <label className="block">
            <span className="font-medium text-slate-800">Дата смерти (необязательно)</span>
            <input type="date" name="deathDate" defaultValue={formatDateForInput(person.deathDate)} className={inputClass} />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="font-medium text-slate-800">Воинское звание</span>
            <input name="militaryRank" defaultValue={person.faculty ?? ""} className={inputClass} />
          </label>
          <label className="block">
            <span className="font-medium text-slate-800">Род войск / направление службы</span>
            <input name="serviceBranch" defaultValue={person.department ?? ""} className={inputClass} />
          </label>
          <label className="block md:col-span-2">
            <span className="font-medium text-slate-800">Период участия</span>
            <input name="participationPeriod" defaultValue={person.participationPeriod ?? ""} className={inputClass} />
          </label>
        </div>

        <label className="block">
          <span className="font-medium text-slate-800">Краткое описание</span>
          <input name="shortDescription" defaultValue={person.shortDescription} className={inputClass} required />
        </label>

        <label className="block">
          <span className="font-medium text-slate-800">Ссылка на фотографию</span>
          <input name="imageUrl" type="url" defaultValue={person.photoUrl ?? ""} className={inputClass} placeholder="https://..." />
        </label>

        <label className="block">
          <span className="font-medium text-slate-800">Статус публикации</span>
          <select name="moderationStatus" defaultValue={person.moderationStatus} className={inputClass}>
            <option value={ModerationStatus.approved}>Опубликовано</option>
            <option value={ModerationStatus.pending}>На модерации</option>
            <option value={ModerationStatus.needs_revision}>Нужна доработка</option>
            <option value={ModerationStatus.rejected}>Скрыто</option>
            <option value={ModerationStatus.draft}>Черновик</option>
          </select>
        </label>

        <button type="submit" className="rounded bg-slate-800 px-4 py-2 text-sm text-white">Сохранить изменения</button>
      </form>
    </div>
  );
}
