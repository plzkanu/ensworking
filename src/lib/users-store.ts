import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import type { RoleCode, User } from "./types";

const DEFAULT_ADMIN_ID = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";

interface EnsUserRow {
  id: string;
  name: string;
  password_hash: string;
  employee_number: string;
  position: string;
  role: RoleCode;
  department: string;
  active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

function mapUser(row: EnsUserRow): User {
  return {
    id: row.id,
    passwordHash: row.password_hash,
    employeeNumber: row.employee_number ?? "",
    name: row.name,
    position: row.position ?? "",
    department: row.department ?? "",
    role: row.role,
    active: row.active,
    mustChangePassword: row.must_change_password ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function defaultResetPassword(userId: string): string {
  return `${userId}!!`;
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
    employee_number: "",
    position: "",
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

export async function listUsers(): Promise<User[]> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data as EnsUserRow[]).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ? mapUser(data as EnsUserRow) : null;
}

export async function createUser(input: {
  id: string;
  password: string;
  employeeNumber?: string;
  name: string;
  position?: string;
  department?: string;
  role: RoleCode;
  active?: boolean;
}): Promise<User> {
  requireSupabase();
  const id = input.id.trim();
  if (!id) {
    throw new Error("아이디를 입력해 주세요.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_users")
    .insert({
      id,
      password_hash: passwordHash,
      employee_number: input.employeeNumber?.trim() ?? "",
      name: input.name.trim(),
      position: input.position?.trim() ?? "",
      department: input.department?.trim() ?? "",
      role: input.role,
      active: input.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 아이디입니다.");
    }
    if (error.code === "23503") {
      throw new Error("존재하지 않는 역할입니다.");
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapUser(data as EnsUserRow);
}

export async function updateUser(
  id: string,
  input: {
    password?: string;
    employeeNumber?: string;
    name?: string;
    position?: string;
    department?: string;
    role?: RoleCode;
    active?: boolean;
    mustChangePassword?: boolean;
  },
): Promise<User> {
  requireSupabase();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.password) {
    updates.password_hash = await bcrypt.hash(input.password, 10);
    if (input.mustChangePassword === undefined) {
      updates.must_change_password = false;
    }
  }
  if (input.employeeNumber !== undefined) {
    updates.employee_number = input.employeeNumber.trim();
  }
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.position !== undefined) updates.position = input.position.trim();
  if (input.department !== undefined) {
    updates.department = input.department.trim();
  }
  if (input.role !== undefined) updates.role = input.role;
  if (input.active !== undefined) updates.active = input.active;
  if (input.mustChangePassword !== undefined) {
    updates.must_change_password = input.mustChangePassword;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_users")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23503") {
      throw new Error("존재하지 않는 역할입니다.");
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapUser(data as EnsUserRow);
}

export async function resetUserPassword(id: string): Promise<User> {
  const user = await getUserById(id);
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  return updateUser(id, {
    password: defaultResetPassword(id),
    mustChangePassword: true,
  });
}

export async function changeUserPassword(
  id: string,
  input: { currentPassword: string; newPassword: string },
): Promise<User> {
  const user = await getUserById(id);
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("현재 비밀번호가 올바르지 않습니다.");
  }

  const newPassword = input.newPassword.trim();
  if (!newPassword) {
    throw new Error("새 비밀번호를 입력해 주세요.");
  }

  if (newPassword === defaultResetPassword(id)) {
    throw new Error(
      "초기화 비밀번호는 사용할 수 없습니다. 다른 비밀번호를 입력해 주세요.",
    );
  }

  return updateUser(id, {
    password: newPassword,
    mustChangePassword: false,
  });
}

export async function importUsersFromExcel(
  rows: Array<{
    rowNumber: number;
    id: string;
    password: string;
    employeeNumber: string;
    name: string;
    position: string;
    department: string;
    role: RoleCode;
    active: boolean;
  }>,
): Promise<
  Array<{
    rowNumber: number;
    id: string;
    status: "created" | "updated" | "failed";
    message?: string;
  }>
> {
  const results: Array<{
    rowNumber: number;
    id: string;
    status: "created" | "updated" | "failed";
    message?: string;
  }> = [];

  for (const row of rows) {
    try {
      const existing = await getUserById(row.id);
      if (existing) {
        await updateUser(row.id, {
          ...(row.password ? { password: row.password } : {}),
          employeeNumber: row.employeeNumber,
          name: row.name,
          position: row.position,
          department: row.department,
          role: row.role,
          active: row.active,
        });
        results.push({
          rowNumber: row.rowNumber,
          id: row.id,
          status: "updated",
        });
      } else {
        if (!row.password) {
          throw new Error("신규 등록 시 비밀번호는 필수입니다.");
        }
        await createUser({
          id: row.id,
          password: row.password,
          employeeNumber: row.employeeNumber,
          name: row.name,
          position: row.position,
          department: row.department,
          role: row.role,
          active: row.active,
        });
        results.push({
          rowNumber: row.rowNumber,
          id: row.id,
          status: "created",
        });
      }
    } catch (error) {
      results.push({
        rowNumber: row.rowNumber,
        id: row.id,
        status: "failed",
        message: error instanceof Error ? error.message : "처리 실패",
      });
    }
  }

  return results;
}

export async function listDistinctDepartments(): Promise<string[]> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_users")
    .select("department")
    .eq("active", true);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  const departments = new Set<string>();
  for (const row of data ?? []) {
    const value = (row as { department?: string }).department?.trim();
    if (value) {
      departments.add(value);
    }
  }

  return [...departments].sort((a, b) => a.localeCompare(b, "ko"));
}

export async function deleteUser(id: string, currentUserId: string): Promise<void> {
  requireSupabase();
  if (id === currentUserId) {
    throw new Error("현재 로그인한 계정은 삭제할 수 없습니다.");
  }

  const user = await getUserById(id);
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  if (user.role === "admin") {
    const supabase = createServerClient();
    const { count, error: countError } = await supabase
      .from("ens_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("active", true);

    if (countError) {
      throw new Error(formatSupabaseNetworkError(countError.message));
    }

    if ((count ?? 0) <= 1) {
      throw new Error("마지막 관리자 계정은 삭제할 수 없습니다.");
    }
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("ens_users").delete().eq("id", id);
  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }
}
