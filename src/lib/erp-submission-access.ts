import type { SessionUser } from "./types";

export type ErpSubmissionViewScope = "own" | "department" | "all";

export function getErpSubmissionViewScope(
  user: SessionUser,
): ErpSubmissionViewScope {
  if (user.role === "admin") {
    return "all";
  }
  if (user.role === "office_manager") {
    return "department";
  }
  return "own";
}

export function canViewOthersErpSubmissions(user: SessionUser): boolean {
  return getErpSubmissionViewScope(user) !== "own";
}

export function canAccessErpSubmission(
  user: SessionUser,
  submission: { userId: string; department: string },
): boolean {
  if (user.role === "admin") {
    return true;
  }
  if (submission.userId === user.id) {
    return true;
  }
  if (
    user.role === "office_manager" &&
    user.department &&
    submission.department === user.department
  ) {
    return true;
  }
  return false;
}
