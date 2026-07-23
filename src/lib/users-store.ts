import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import type { User, UserRole } from "./types";

const DEFAULT_ADMIN_ID = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";

interface EnsUserRow {
  id: string;
  name: string;
  password_hash: string;
  role: UserRole;
  department: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function mapUser(row: EnsUserRow): User {
  return {
    id: row.id,
    passwordHash: row.password_hash,
    name: row.name,
    department: row.department ?? "",
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_users 테이블과 환경 변수를 확인하세요.",
    );
  }
}

async function seedDefaultAdminIfEmpty(): Promise<void> {
  const supabase = createServerClient();
  const { count, error: countError } = await supabase
    .from("ens_users")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(formatSupabaseNetworkError(countError.message));
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const { error } = await supabase.from("ens_users").insert({
    id: DEFAULT_ADMIN_ID,
    name: "시스템 관리자",
    password_hash: passwordHash,
    role: "admin",
    department: "",
    active: true,
  });

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }
}

export async function verifyUserCredentials(
  userId: string,
  password: string,
): Promise<User | null> {
  requireSupabase();
  await seedDefaultAdminIfEmpty();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  if (!data || !data.active) {
    return null;
  }

  const user = mapUser(data as EnsUserRow);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return user;
}
