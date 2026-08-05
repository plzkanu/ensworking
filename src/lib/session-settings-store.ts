import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import {
  DEFAULT_INACTIVITY_TIMEOUT_MINUTES,
  MAX_INACTIVITY_TIMEOUT_MINUTES,
  MIN_INACTIVITY_TIMEOUT_MINUTES,
} from "@/lib/session-settings-constants";
import type { SessionSettings } from "@/lib/types";

export {
  DEFAULT_INACTIVITY_TIMEOUT_MINUTES,
  INACTIVITY_TIMEOUT_OPTIONS,
  MAX_INACTIVITY_TIMEOUT_MINUTES,
  MIN_INACTIVITY_TIMEOUT_MINUTES,
} from "@/lib/session-settings-constants";

interface SessionSettingsRow {
  inactivity_timeout_minutes: number;
  updated_at: string;
  updated_by: string | null;
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_session_settings 테이블을 확인하세요.",
    );
  }
}

function mapSettings(row: SessionSettingsRow): SessionSettings {
  return {
    inactivityTimeoutMinutes: row.inactivity_timeout_minutes,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function defaultSettings(): SessionSettings {
  return {
    inactivityTimeoutMinutes: DEFAULT_INACTIVITY_TIMEOUT_MINUTES,
    updatedAt: new Date(0).toISOString(),
    updatedBy: null,
  };
}

export function normalizeInactivityTimeoutMinutes(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    throw new Error("미사용 자동 로그아웃 시간이 올바르지 않습니다.");
  }
  if (
    parsed < MIN_INACTIVITY_TIMEOUT_MINUTES ||
    parsed > MAX_INACTIVITY_TIMEOUT_MINUTES
  ) {
    throw new Error(
      `미사용 자동 로그아웃 시간은 ${MIN_INACTIVITY_TIMEOUT_MINUTES}~${MAX_INACTIVITY_TIMEOUT_MINUTES}분 사이여야 합니다.`,
    );
  }
  return parsed;
}

export async function getSessionSettings(): Promise<SessionSettings> {
  if (!isSupabaseConfigured()) {
    return defaultSettings();
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_session_settings")
    .select("inactivity_timeout_minutes, updated_at, updated_by")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ? mapSettings(data as SessionSettingsRow) : defaultSettings();
}

export async function updateSessionSettings(input: {
  inactivityTimeoutMinutes: number;
  updatedBy: string;
}): Promise<SessionSettings> {
  requireSupabase();
  const inactivityTimeoutMinutes = normalizeInactivityTimeoutMinutes(
    input.inactivityTimeoutMinutes,
  );

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_session_settings")
    .upsert(
      {
        id: "default",
        inactivity_timeout_minutes: inactivityTimeoutMinutes,
        updated_at: new Date().toISOString(),
        updated_by: input.updatedBy,
      },
      { onConflict: "id" },
    )
    .select("inactivity_timeout_minutes, updated_at, updated_by")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapSettings(data as SessionSettingsRow);
}
