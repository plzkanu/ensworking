export const PROGRAM_FEEDBACK_CATEGORIES = [
  { value: "modification", label: "수정요청" },
  { value: "feature", label: "기능개선" },
  { value: "bug", label: "오류신고" },
  { value: "other", label: "기타" },
] as const;

export const PROGRAM_FEEDBACK_STATUSES = [
  { value: "registered", label: "등록" },
  { value: "received", label: "접수" },
  { value: "reviewing", label: "내용파악중" },
  { value: "in_progress", label: "수정중" },
  { value: "completed", label: "완료" },
  { value: "rejected", label: "반려" },
] as const;

export type ProgramFeedbackCategory =
  (typeof PROGRAM_FEEDBACK_CATEGORIES)[number]["value"];

export type ProgramFeedbackStatus =
  (typeof PROGRAM_FEEDBACK_STATUSES)[number]["value"];

const CATEGORY_SET = new Set<string>(
  PROGRAM_FEEDBACK_CATEGORIES.map((item) => item.value),
);
const STATUS_SET = new Set<string>(
  PROGRAM_FEEDBACK_STATUSES.map((item) => item.value),
);

export function parseProgramFeedbackCategory(
  value: string,
): ProgramFeedbackCategory | null {
  const trimmed = value.trim();
  return CATEGORY_SET.has(trimmed)
    ? (trimmed as ProgramFeedbackCategory)
    : null;
}

export function parseProgramFeedbackStatus(
  value: string,
): ProgramFeedbackStatus | null {
  const trimmed = value.trim();
  return STATUS_SET.has(trimmed) ? (trimmed as ProgramFeedbackStatus) : null;
}

export function programFeedbackCategoryLabel(value: string): string {
  return (
    PROGRAM_FEEDBACK_CATEGORIES.find((item) => item.value === value)?.label ??
    value
  );
}

export function programFeedbackStatusLabel(value: string): string {
  return (
    PROGRAM_FEEDBACK_STATUSES.find((item) => item.value === value)?.label ??
    value
  );
}

export function programFeedbackStatusClassName(value: string): string {
  switch (value) {
    case "registered":
      return "bg-slate-100 text-slate-700";
    case "received":
      return "bg-sky-100 text-sky-800";
    case "reviewing":
      return "bg-amber-100 text-amber-800";
    case "in_progress":
      return "bg-violet-100 text-violet-800";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
