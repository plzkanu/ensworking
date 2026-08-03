import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { logUserActivity } from "@/lib/activity-log-store";
import { listUsers } from "@/lib/users-store";
import type { UserAccessStatus } from "@/lib/types";

const SESSION_MAX_AGE_MS = 60 * 60 * 8 * 1000;
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

interface AccessLogRow {
  id: string;
  user_id: string;
  event_type: "login" | "logout";
  ip_address: string;
  user_agent: string;
  created_at: string;
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_user_access_logs 테이블을 확인하세요.",
    );
  }
}

export async function logUserAccess(input: {
  userId: string;
  eventType: "login" | "logout";
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  requireSupabase();
  const supabase = createServerClient();
  const { error } = await supabase.from("ens_user_access_logs").insert({
    user_id: input.userId,
    event_type: input.eventType,
    ip_address: input.ipAddress ?? "",
    user_agent: input.userAgent ?? "",
  });

  if (error) {
    console.error("[access-log] insert failed:", error.message, error);
  }
}

async function getRecentAccessEvents(userId: string, sinceIso: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_user_access_logs")
    .select("event_type, created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ?? [];
}

async function getLatestActivityAt(userId: string): Promise<string | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_user_activity_logs")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data?.created_at as string | undefined) ?? null;
}

/** 유효 세션이지만 login 기록이 없을 때(기능 도입 전 로그인 등) 보정 */
async function ensureAccessLoginRecord(input: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const since8h = new Date(Date.now() - SESSION_MAX_AGE_MS).toISOString();
  const events = await getRecentAccessEvents(input.userId, since8h);
  const latestLogin = events.find((event) => event.event_type === "login");
  const latestLogout = events.find((event) => event.event_type === "logout");

  const needsLogin =
    !latestLogin ||
    (latestLogout &&
      new Date(latestLogout.created_at as string).getTime() >=
        new Date(latestLogin.created_at as string).getTime());

  if (needsLogin) {
    await logUserAccess({
      userId: input.userId,
      eventType: "login",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}

async function maybeRecordHeartbeat(input: {
  userId: string;
  resource?: string;
  ipAddress?: string;
}): Promise<void> {
  const latestAt = await getLatestActivityAt(input.userId);
  if (
    latestAt &&
    Date.now() - new Date(latestAt).getTime() < HEARTBEAT_INTERVAL_MS
  ) {
    return;
  }

  await logUserActivity({
    userId: input.userId,
    action: "session_active",
    resource: input.resource ?? "/dashboard",
    ipAddress: input.ipAddress,
  });
}

/** 대시보드 진입 시 세션 접속 기록·활동 하트비트 동기화 */
export async function syncSessionPresence(input: {
  userId: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  requireSupabase();
  try {
    await ensureAccessLoginRecord(input);
    await maybeRecordHeartbeat(input);
  } catch (error) {
    console.error("[session-presence] sync failed:", error);
  }
}

function resolveOnlineStatus(input: {
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  lastActivityAt: string | null;
}): boolean {
  const now = Date.now();
  const logoutTime = input.lastLogoutAt
    ? new Date(input.lastLogoutAt).getTime()
    : 0;

  const presenceTimes = [input.lastLoginAt, input.lastActivityAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime());

  if (presenceTimes.length === 0) {
    return false;
  }

  const lastPresence = Math.max(...presenceTimes);
  return (
    lastPresence > logoutTime && now - lastPresence <= SESSION_MAX_AGE_MS
  );
}

export async function getUserAccessStatusList(): Promise<UserAccessStatus[]> {
  requireSupabase();
  const users = await listUsers();
  const supabase = createServerClient();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [accessResult, activityResult, loginCountResult] = await Promise.all([
    supabase
      .from("ens_user_access_logs")
      .select("user_id, event_type, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("ens_user_activity_logs")
      .select("user_id, resource, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("ens_user_access_logs")
      .select("user_id")
      .eq("event_type", "login")
      .gte("created_at", since30d),
  ]);

  if (accessResult.error) {
    throw new Error(formatSupabaseNetworkError(accessResult.error.message));
  }
  if (activityResult.error) {
    throw new Error(formatSupabaseNetworkError(activityResult.error.message));
  }
  if (loginCountResult.error) {
    throw new Error(formatSupabaseNetworkError(loginCountResult.error.message));
  }

  const accessRows = (accessResult.data ?? []) as AccessLogRow[];
  const activityRows = activityResult.data ?? [];
  const loginCountRows = loginCountResult.data ?? [];

  const latestLogin = new Map<
    string,
    { createdAt: string; ipAddress: string }
  >();
  const latestLogout = new Map<string, string>();
  const loginCount30d = new Map<string, number>();

  for (const row of accessRows) {
    if (row.event_type === "login" && !latestLogin.has(row.user_id)) {
      latestLogin.set(row.user_id, {
        createdAt: row.created_at,
        ipAddress: row.ip_address ?? "",
      });
    }
    if (row.event_type === "logout" && !latestLogout.has(row.user_id)) {
      latestLogout.set(row.user_id, row.created_at);
    }
  }

  for (const row of loginCountRows) {
    const userId = row.user_id as string;
    loginCount30d.set(userId, (loginCount30d.get(userId) ?? 0) + 1);
  }

  const latestActivity = new Map<
    string,
    { createdAt: string; resource: string }
  >();
  for (const row of activityRows) {
    const userId = row.user_id as string;
    if (!latestActivity.has(userId)) {
      latestActivity.set(userId, {
        createdAt: row.created_at as string,
        resource: (row.resource as string) ?? "",
      });
    }
  }

  return users.map((user) => {
    const login = latestLogin.get(user.id);
    const logoutAt = latestLogout.get(user.id) ?? null;
    const activity = latestActivity.get(user.id);
    const lastLoginAt = login?.createdAt ?? null;
    const lastActivityAt = activity?.createdAt ?? null;

    const isOnline = resolveOnlineStatus({
      lastLoginAt,
      lastLogoutAt: logoutAt,
      lastActivityAt,
    });

    return {
      userId: user.id,
      userName: user.name,
      department: user.department,
      role: user.role,
      active: user.active,
      lastLoginAt,
      lastLogoutAt: logoutAt,
      lastLoginIp: login?.ipAddress ?? "",
      isOnline,
      loginCount30d: loginCount30d.get(user.id) ?? 0,
      lastActivityAt,
      lastActivityResource: activity?.resource ?? "",
    };
  });
}