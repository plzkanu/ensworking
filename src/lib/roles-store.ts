import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import type { Role } from "./types";

interface EnsRoleRow {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRole(row: EnsRoleRow): Role {
  return {
    code: row.code,
    name: row.name,
    description: row.description ?? "",
    sortOrder: row.sort_order,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_roles 테이블과 환경 변수를 확인하세요.",
    );
  }
}

export async function listRoles(includeInactive = false): Promise<Role[]> {
  requireSupabase();
  const supabase = createServerClient();
  let query = supabase
    .from("ens_roles")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data as EnsRoleRow[]).map(mapRole);
}

export async function getRoleByCode(code: string): Promise<Role | null> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_roles")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ? mapRole(data as EnsRoleRow) : null;
}

export async function createRole(input: {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
}): Promise<Role> {
  requireSupabase();
  const code = input.code.trim();
  if (!/^[a-z][a-z0-9_]*$/.test(code)) {
    throw new Error(
      "역할 코드는 영문 소문자로 시작하고, 소문자·숫자·밑줄만 사용할 수 있습니다.",
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_roles")
    .insert({
      code,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      sort_order: input.sortOrder ?? 99,
      active: input.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 역할 코드입니다.");
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapRole(data as EnsRoleRow);
}

export async function updateRole(
  code: string,
  input: {
    name?: string;
    description?: string;
    sortOrder?: number;
    active?: boolean;
  },
): Promise<Role> {
  requireSupabase();
  const supabase = createServerClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.description !== undefined) {
    updates.description = input.description.trim();
  }
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.active !== undefined) updates.active = input.active;

  const { data, error } = await supabase
    .from("ens_roles")
    .update(updates)
    .eq("code", code)
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapRole(data as EnsRoleRow);
}

export async function deleteRole(code: string): Promise<void> {
  requireSupabase();
  if (code === "admin") {
    throw new Error("관리자 역할은 삭제할 수 없습니다.");
  }

  const supabase = createServerClient();
  const { count, error: countError } = await supabase
    .from("ens_users")
    .select("*", { count: "exact", head: true })
    .eq("role", code);

  if (countError) {
    throw new Error(formatSupabaseNetworkError(countError.message));
  }

  if ((count ?? 0) > 0) {
    throw new Error("해당 역할을 사용 중인 사용자가 있어 삭제할 수 없습니다.");
  }

  const { error } = await supabase.from("ens_roles").delete().eq("code", code);
  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }
}

export async function countUsersByRole(code: string): Promise<number> {
  requireSupabase();
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from("ens_users")
    .select("*", { count: "exact", head: true })
    .eq("role", code);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return count ?? 0;
}
