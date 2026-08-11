import { flattenSubmissionsToRows } from "@/lib/erp-submission-rows";
import type {
  ErpSubmission,
  ErpSubmissionDayEntry,
  ErpSubmissionPersonBlock,
} from "@/lib/types";

export interface ErpSubmissionTotals {
  submissionCount: number;
  recordCount: number;
  totalHours: number;
}

export interface ErpDepartmentSummary extends ErpSubmissionTotals {
  department: string;
}

export interface ErpPersonSummary extends ErpSubmissionTotals {
  name: string;
  department: string;
  empno: string;
}

function parseHours(value: number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

function roundHours(hours: number): number {
  return Math.round(hours * 10) / 10;
}

function accumulateBlockHours(
  block: ErpSubmissionPersonBlock,
  totals: { recordCount: number; totalHours: number },
) {
  for (const slot of block.slots) {
    for (const entry of Object.values(slot)) {
      if (!entry) {
        continue;
      }
      totals.recordCount += 1;
      totals.totalHours += parseHours(entry.hours);
    }
  }
}

export function sumSubmissionPayloadHours(submission: ErpSubmission): number {
  let total = 0;
  for (const block of submission.payload.personBlocks) {
    for (const slot of block.slots) {
      for (const entry of Object.values(slot)) {
        if (entry) {
          total += parseHours((entry as ErpSubmissionDayEntry).hours);
        }
      }
    }
  }
  return roundHours(total);
}

export function buildSubmissionTotals(
  submissions: ErpSubmission[],
): ErpSubmissionTotals {
  if (submissions.length === 0) {
    return { submissionCount: 0, recordCount: 0, totalHours: 0 };
  }

  let recordCount = 0;
  let totalHours = 0;
  for (const submission of submissions) {
    for (const block of submission.payload.personBlocks) {
      const bucket = { recordCount: 0, totalHours: 0 };
      accumulateBlockHours(block, bucket);
      recordCount += bucket.recordCount;
      totalHours += bucket.totalHours;
    }
  }

  return {
    submissionCount: submissions.length,
    recordCount,
    totalHours: roundHours(totalHours),
  };
}

export function buildDepartmentSummaries(
  submissions: ErpSubmission[],
): ErpDepartmentSummary[] {
  const groups = new Map<
    string,
    { submissionIds: Set<string>; recordCount: number; totalHours: number }
  >();

  for (const submission of submissions) {
    const department = submission.department?.trim() || "미지정";
    if (!groups.has(department)) {
      groups.set(department, {
        submissionIds: new Set(),
        recordCount: 0,
        totalHours: 0,
      });
    }
    const group = groups.get(department)!;
    group.submissionIds.add(submission.id);

    for (const block of submission.payload.personBlocks) {
      const bucket = { recordCount: 0, totalHours: 0 };
      accumulateBlockHours(block, bucket);
      group.recordCount += bucket.recordCount;
      group.totalHours += bucket.totalHours;
    }
  }

  return [...groups.entries()]
    .map(([department, group]) => ({
      department,
      submissionCount: group.submissionIds.size,
      recordCount: group.recordCount,
      totalHours: roundHours(group.totalHours),
    }))
    .sort((a, b) => a.department.localeCompare(b.department, "ko"));
}

export function buildPersonSummaries(
  submissions: ErpSubmission[],
): ErpPersonSummary[] {
  const groups = new Map<
    string,
    {
      name: string;
      department: string;
      empno: string;
      submissionIds: Set<string>;
      recordCount: number;
      totalHours: number;
    }
  >();

  for (const submission of submissions) {
    for (const block of submission.payload.personBlocks) {
      const name = block.name?.trim() || "미지정";
      const department = block.dept?.trim() || "미지정";
      const empno = block.empno?.trim() || "";
      const key = `${name}\0${department}\0${empno}`;

      if (!groups.has(key)) {
        groups.set(key, {
          name,
          department,
          empno,
          submissionIds: new Set(),
          recordCount: 0,
          totalHours: 0,
        });
      }

      const group = groups.get(key)!;
      group.submissionIds.add(submission.id);
      const bucket = { recordCount: 0, totalHours: 0 };
      accumulateBlockHours(block, bucket);
      group.recordCount += bucket.recordCount;
      group.totalHours += bucket.totalHours;
    }
  }

  return [...groups.values()]
    .map((group) => ({
      name: group.name,
      department: group.department,
      empno: group.empno,
      submissionCount: group.submissionIds.size,
      recordCount: group.recordCount,
      totalHours: roundHours(group.totalHours),
    }))
    .sort(
      (a, b) =>
        a.department.localeCompare(b.department, "ko") ||
        a.name.localeCompare(b.name, "ko") ||
        a.empno.localeCompare(b.empno),
    );
}

export function formatTotalHours(hours: number): string {
  const rounded = roundHours(hours);
  if (rounded === 0) {
    return "0시간";
  }
  if (Number.isInteger(rounded)) {
    return `${rounded}시간`;
  }
  return `${rounded.toFixed(1)}시간`;
}

export function buildSubmissionTotalsFromRows(
  submissions: ErpSubmission[],
): ErpSubmissionTotals {
  const rows = flattenSubmissionsToRows(submissions);
  const totalHours = roundHours(
    rows.reduce((sum, row) => sum + parseHours(row.hours), 0),
  );
  return {
    submissionCount: submissions.length,
    recordCount: rows.length,
    totalHours,
  };
}
