import { Role } from "@prisma/client";
import { moderateSubmissionAction } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { getEntityTypeLabel } from "@/lib/entity-labels";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.MODERATOR && session.user.role !== Role.ADMIN)) {
    return <div><h1 className="text-2xl font-semibold">Админ-панель</h1><p className="mt-2">Доступ только для MODERATOR/ADMIN.</p></div>;
  }

  const submissions = await prisma.submission.findMany({ where: { status: { in: ["pending", "needs_revision", "approved"] } }, include: { author: true }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Панель модерации</h1>
      <div className="space-y-4">
        {submissions.map((s) => (
          <article key={s.id} className="rounded border border-slate-300 bg-white p-4">
            <p className="text-sm text-slate-600">Контакт автора: {s.contactName} ({s.contactEmail})</p>
            {s.author ? <p className="text-xs text-slate-500">Связанная учетная запись: {s.author.name} ({s.author.email})</p> : null}
            <p className="font-medium">
              {getEntityTypeLabel(s.targetEntityType)}
              {s.targetEntityId ? <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">уже опубликовано</span> : null}
            </p>
            <pre className="mt-2 overflow-auto rounded bg-slate-100 p-2 text-xs">{JSON.stringify(s.payloadJson, null, 2)}</pre>
            <form action={moderateSubmissionAction} className="mt-3 grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="submissionId" value={s.id} />
              <select name="status" className="rounded border border-slate-300 px-2 py-1">
                <option value="approved">approved</option>
                <option value="needs_revision">needs_revision</option>
                <option value="rejected">rejected</option>
              </select>
              <input name="moderatorComment" placeholder="Комментарий" className="rounded border border-slate-300 px-2 py-1 sm:col-span-2" />
              <button className="rounded bg-slate-800 px-3 py-1 text-white">Применить</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
