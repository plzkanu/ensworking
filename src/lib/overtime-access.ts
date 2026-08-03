import { redirect } from "next/navigation";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { assertOvertimeWindowOpen } from "@/lib/overtime-window-store";
import type { OvertimeType } from "@/lib/types";

export async function requireOvertimePageAccess(type: OvertimeType) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (requireAdmin(user)) {
    return { user, status: await assertOvertimeWindowOpen(type, { isAdmin: true }) };
  }

  try {
    const status = await assertOvertimeWindowOpen(type);
    return { user, status };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "등록 기간이 아닙니다.";
    redirect(
      `/dashboard?overtime_closed=${type}&message=${encodeURIComponent(message)}`,
    );
  }
}
