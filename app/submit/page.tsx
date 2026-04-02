import Link from "next/link";
import crypto from "node:crypto";
import { TypedSubmitForm } from "./typed-submit-form";
import { prisma } from "@/lib/prisma";

type SubmitPageProps = {
  searchParams?: Promise<{ error?: string; success?: string; submissionId?: string; accessToken?: string }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = (await searchParams) ?? {};
  const submittedSubmissionId = params.submissionId;
  const submittedAccessToken = params.accessToken;

  let editableSubmission:
    | {
        id: string;
        contactEmail: string;
        contactName: string;
        accessToken: string;
        payload: Record<string, unknown>;
      }
    | undefined;

  if (params.submissionId && params.accessToken) {
    const accessTokenHash = crypto.createHash("sha256").update(params.accessToken).digest("hex");
    const submission = await prisma.submission.findFirst({
      where: {
        id: params.submissionId,
        accessTokenHash,
        status: { in: ["needs_revision", "rejected"] }
      }
    });

    if (submission) {
      editableSubmission = {
        id: submission.id,
        contactEmail: submission.contactEmail,
        contactName: submission.contactName,
        accessToken: params.accessToken,
        payload: (submission.payloadJson as Record<string, unknown>) ?? {}
      };
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Добавить материал</h1>
      {editableSubmission ? (
        <p className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Вы редактируете материал после возврата на доработку.
        </p>
      ) : null}
      <TypedSubmitForm editableSubmission={editableSubmission} />
      {submittedSubmissionId && submittedAccessToken ? (
        <p className="mt-3 text-sm text-slate-600">
          Ссылка для проверки статуса:{" "}
          <Link
            href={`/submission-status?submissionId=${encodeURIComponent(submittedSubmissionId)}&accessToken=${encodeURIComponent(submittedAccessToken)}`}
            className="underline"
          >
            открыть страницу статуса заявки
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
