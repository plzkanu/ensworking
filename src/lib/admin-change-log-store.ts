import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { getRequestMeta } from "@/lib/request-meta";
import type { AdminChangeLogEntry, SessionUser } from "@/lib/types";

interface AdminChangeLogRow {
  id: string;
  admin_id: string;
  admin_name: string;
  category: string;
  action: string;
  target_type: string;
  target_id: string;
  summary: string;
  detail: Record<string, unknown>;
  ip_address: string;
  recorded_date: string | null;
  created_at: string;
}

const MANUAL_CATEGORY = "manual";
const MANUAL_ACTION = "note";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_admin_change_logs 테이블을 확인하세요.",
    );
  }
}

export function todayKstDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

export function parseRecordedDate(value: string): string | null {
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) {
    return null;
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return trimmed;
}

function mapLog(row: AdminChangeLogRow): AdminChangeLogEntry {
  return {
    id: row.id,
    adminId: row.admin_id,
    adminName: row.admin_name,
    category: row.category,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    summary: row.summary,
    detail: row.detail ?? {},
    ipAddress: row.ip_address,
    recordedDate: row.recorded_date ?? row.created_at.slice(0, 10),
    createdAt: row.created_at,
  };
}

export async function createManualAdminChangeLog(input: {
  adminId: string;
  adminName: string;
  content: string;
  recordedDate: string;
  ipAddress?: string;
}): Promise<AdminChangeLogEntry> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_admin_change_logs")
    .insert({
      admin_id: input.adminId,
      admin_name: input.adminName,
      category: MANUAL_CATEGORY,
      action: MANUAL_ACTION,
      target_type: "",
      target_id: "",
      summary: input.content,
      detail: {},
      ip_address: input.ipAddress ?? "",
      recorded_date: input.recordedDate,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapLog(data as AdminChangeLogRow);
}

export async function createManualAdminChangeLogFromRequest(
  request: Request,
  session: SessionUser,
  input: { content: string; recordedDate: string },
): Promise<AdminChangeLogEntry> {
  const { ip } = getRequestMeta(request);
  return createManualAdminChangeLog({
    adminId: session.id,
    adminName: session.name,
    content: input.content,
    recordedDate: input.recordedDate,
    ipAddress: ip,
  });
}

export async function listAdminChangeLogs(options?: {
  limit?: number;
}): Promise<AdminChangeLogEntry[]> {
  requireSupabase();
  const supabase = createServerClient();
  const limit = Math.min(options?.limit ?? 300, 500);

  const { data, error } = await supabase
    .from("ens_admin_change_logs")
    .select("*")
    .eq("category", MANUAL_CATEGORY)
    .order("recorded_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data as AdminChangeLogRow[]).map(mapLog);
}

export async function updateManualAdminChangeLog(
  id: string,
  input: { content: string; recordedDate: string },
): Promise<AdminChangeLogEntry> {
  requireSupabase();
  const supabase = createServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("ens_admin_change_logs")
    .select("id")
    .eq("id", id)
    .eq("category", MANUAL_CATEGORY)
    .maybeSingle();

  if (fetchError) {
    throw new Error(formatSupabaseNetworkError(fetchError.message));
  }
  if (!existing) {
    throw new Error("수정 내역을 찾을 수 없습니다.");
  }

  const { data, error } = await supabase
    .from("ens_admin_change_logs")
    .update({
      summary: input.content,
      recorded_date: input.recordedDate,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapLog(data as AdminChangeLogRow);
}
