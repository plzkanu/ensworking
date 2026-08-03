import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import type {
  OvertimeRegistrationWindow,
  OvertimeType,
  OvertimeWindowStatus,
} from "@/lib/types";

interface OvertimeWindowRow {
  overtime_type: OvertimeType;
  starts_at: string;
  ends_at: string;
  enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

const OVERTIME_LABELS: Record<OvertimeType, string> = {
  regular: "시간외근무 (일반)",
  flexible: "시간외근무 (유연)",
};

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_overtime_registration_windows 테이블을 확인하세요.",
    );
  }
}

function mapWindow(row: OvertimeWindowRow): OvertimeRegistrationWindow {
  return {
    overtimeType: row.overtime_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    enabled: row.enabled,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function getOvertimeLabel(type: OvertimeType): string {
  return OVERTIME_LABELS[type];
}

export function isOvertimeWindowOpen(
  window: OvertimeRegistrationWindow | null,
  reference = new Date(),
): boolean {
  if (!window?.enabled) {
    return false;
  }
  const now = reference.getTime();
  const starts = new Date(window.startsAt).getTime();
  const ends = new Date(window.endsAt).getTime();
  return now >= starts && now <= ends;
}

function buildStatusMessage(
  type: OvertimeType,
  window: OvertimeRegistrationWindow | null,
  open: boolean,
  reference = new Date(),
): string {
  const label = getOvertimeLabel(type);
  if (!window) {
    return `${label} 등록 기간이 설정되지 않았습니다.`;
  }
  if (!window.enabled) {
    return `${label} 등록이 현재 비활성화되어 있습니다.`;
  }
  if (open) {
    return `${label} 등록 기간입니다.`;
  }
  const now = reference.getTime();
  const starts = new Date(window.startsAt).getTime();
  if (now < starts) {
    return `${label} 등록 기간이 아직 시작되지 않았습니다.`;
  }
  return `${label} 등록 기간이 종료되었습니다.`;
}

export async function getOvertimeWindow(
  type: OvertimeType,
): Promise<OvertimeRegistrationWindow | null> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_overtime_registration_windows")
    .select("*")
    .eq("overtime_type", type)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ? mapWindow(data as OvertimeWindowRow) : null;
}

export async function listOvertimeWindows(): Promise<OvertimeRegistrationWindow[]> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_overtime_registration_windows")
    .select("*")
    .order("overtime_type", { ascending: true });

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data as OvertimeWindowRow[]).map(mapWindow);
}

export async function getOvertimeWindowStatus(
  type: OvertimeType,
  reference = new Date(),
): Promise<OvertimeWindowStatus> {
  const window = await getOvertimeWindow(type);
  const open = isOvertimeWindowOpen(window, reference);
  return {
    overtimeType: type,
    label: getOvertimeLabel(type),
    configured: Boolean(window),
    enabled: window?.enabled ?? false,
    open,
    startsAt: window?.startsAt ?? null,
    endsAt: window?.endsAt ?? null,
    message: buildStatusMessage(type, window, open, reference),
  };
}

export async function listOvertimeWindowStatuses(
  reference = new Date(),
): Promise<OvertimeWindowStatus[]> {
  const types: OvertimeType[] = ["regular", "flexible"];
  return Promise.all(types.map((type) => getOvertimeWindowStatus(type, reference)));
}

export async function upsertOvertimeWindow(
  type: OvertimeType,
  input: {
    startsAt: string;
    endsAt: string;
    enabled: boolean;
    updatedBy: string;
  },
): Promise<OvertimeRegistrationWindow> {
  requireSupabase();
  const starts = new Date(input.startsAt);
  const ends = new Date(input.endsAt);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    throw new Error("등록 시작·종료 일시 형식이 올바르지 않습니다.");
  }
  if (starts.getTime() > ends.getTime()) {
    throw new Error("등록 시작 일시는 종료 일시보다 이후일 수 없습니다.");
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_overtime_registration_windows")
    .upsert(
      {
        overtime_type: type,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        enabled: input.enabled,
        updated_at: new Date().toISOString(),
        updated_by: input.updatedBy,
      },
      { onConflict: "overtime_type" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapWindow(data as OvertimeWindowRow);
}

export async function assertOvertimeWindowOpen(
  type: OvertimeType,
  options?: { isAdmin?: boolean; reference?: Date },
): Promise<OvertimeWindowStatus> {
  if (options?.isAdmin) {
    return getOvertimeWindowStatus(type, options.reference);
  }

  const status = await getOvertimeWindowStatus(type, options?.reference);
  if (!status.open) {
    throw new Error(status.message);
  }
  return status;
}
