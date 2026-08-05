import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { listUsers } from "@/lib/users-store";
import type { ActivityLogEntry } from "@/lib/types";

interface ActivityLogRow {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  detail: string;
  ip_address: string;
  created_at: string;
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_user_activity_logs 테이블을 확인하세요.",
    );
  }
}

export async function logUserActivity(input: {
  userId: string;
  action: string;
  resource?: string;
  detail?: string;
  ipAddress?: string;
}): Promise<void> {
  requireSupabase();
  const supabase = createServerClient();
  const { error } = await supabase.from("ens_user_activity_logs").insert({
    user_id: input.userId,
    action: input.action,
    resource: input.resource ?? "",
    detail: input.detail ?? "",
    ip_address: input.ipAddress ?? "",
  });

  if (error) {
    console.error("[activity-log] insert failed:", error.message, error);
  }
}

export async function listActivityLogs(options?: {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<ActivityLogEntry[]> {
  requireSupabase();
  const supabase = createServerClient();
  const limit = options?.userId
    ? Math.min(options?.limit ?? 10000, 20000)
    : Math.min(options?.limit ?? 200, 500);

  let query = supabase
    .from("ens_user_activity_logs")
    .select("id, user_id, action, resource, detail, ip_address, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }
  if (options?.action) {
    query = query.eq("action", options.action);
  }
  if (options?.from) {
    query = query.gte("created_at", options.from);
  }
  if (options?.to) {
    query = query.lte("created_at", options.to);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  const users = await listUsers();
  const userNames = new Map(users.map((user) => [user.id, user.name]));

  return (data ?? []).map((row) => {
    const typed = row as ActivityLogRow;
    return {
      id: typed.id,
      userId: typed.user_id,
      userName: userNames.get(typed.user_id) ?? typed.user_id,
      action: typed.action,
      resource: typed.resource,
      detail: typed.detail,
      ipAddress: typed.ip_address,
      createdAt: typed.created_at,
    };
  });
}
