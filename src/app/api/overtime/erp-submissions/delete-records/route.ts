import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canAccessErpSubmission } from "@/lib/erp-submission-access";
import type { ErpSubmissionRecordRef } from "@/lib/erp-submission-mutations";
import { buildUpdatedSubmissionAfterDelete } from "@/lib/erp-submission-mutations";
import {
  deleteErpSubmission,
  getErpSubmissionById,
  updateErpSubmission,
} from "@/lib/erp-submission-store";

export const dynamic = "force-dynamic";

function parseRecordRefs(body: unknown): ErpSubmissionRecordRef[] {
  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { records?: unknown }).records)
  ) {
    return [];
  }

  const refs: ErpSubmissionRecordRef[] = [];
  for (const item of (body as { records: unknown[] }).records) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Partial<ErpSubmissionRecordRef>;
    if (
      !record.submissionId?.trim() ||
      !record.empno?.trim() ||
      !record.name?.trim() ||
      !record.date?.trim() ||
      typeof record.slotIndex !== "number" ||
      record.slotIndex < 0
    ) {
      continue;
    }
    refs.push({
      submissionId: record.submissionId.trim(),
      empno: record.empno.trim(),
      name: record.name.trim(),
      slotIndex: record.slotIndex,
      date: record.date.trim(),
    });
  }

  return refs;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const records = parseRecordRefs(body);
    if (records.length === 0) {
      return NextResponse.json(
        { error: "삭제할 근무 기록을 선택해 주세요." },
        { status: 400 },
      );
    }

    const submissionIds = [...new Set(records.map((record) => record.submissionId))];
    const submissions = await Promise.all(
      submissionIds.map((id) => getErpSubmissionById(id)),
    );

    for (let index = 0; index < submissionIds.length; index += 1) {
      const submission = submissions[index];
      if (!submission) {
        return NextResponse.json(
          { error: "제출 내역을 찾을 수 없습니다." },
          { status: 404 },
        );
      }
      if (!canAccessErpSubmission(user, submission)) {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    }

    let deletedRecords = 0;
    let deletedSubmissions = 0;
    let updatedSubmissions = 0;

    for (const submissionId of submissionIds) {
      const submission = submissions.find((item) => item?.id === submissionId);
      if (!submission) {
        continue;
      }

      const refsForSubmission = records.filter(
        (record) => record.submissionId === submissionId,
      );
      deletedRecords += refsForSubmission.length;

      const updated = buildUpdatedSubmissionAfterDelete(submission, records);
      if (!updated) {
        await deleteErpSubmission(submissionId);
        deletedSubmissions += 1;
        continue;
      }

      await updateErpSubmission(submissionId, updated);
      updatedSubmissions += 1;
    }

    return NextResponse.json({
      ok: true,
      deletedRecords,
      updatedSubmissions,
      deletedSubmissions,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "근무 기록 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
