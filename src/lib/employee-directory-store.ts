import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import type { EmployeeDirectoryEntry } from "./types";

interface EmployeeDirectoryRow {
  emp_id: string;
  emp_name: string | null;
  dept_name: string | null;
  position_name: string | null;
  emp_type_name: string | null;
  retire_date: string | null;
  synced_at: string | null;
}

function mapRow(row: EmployeeDirectoryRow): EmployeeDirectoryEntry {
  return {
    empId: row.emp_id,
    name: row.emp_name ?? "",
    dept: row.dept_name ?? "",
    position: row.position_name ?? "",
    empType: row.emp_type_name ?? "",
    retireDate: row.retire_date ?? "",
    syncedAt: row.synced_at,
  };
}

export async function listEmployeeDirectory(): Promise<{
  employees: EmployeeDirectoryEntry[];
  syncedAt: string | null;
}> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employee_directory")
    .select(
      "emp_id, emp_name, dept_name, position_name, emp_type_name, retire_date, synced_at",
    )
    .eq("is_deleted", false)
    .order("emp_id");

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  const employees = (data ?? []).map(mapRow);
  const syncedAt = employees.reduce<string | null>((latest, entry) => {
    if (!entry.syncedAt) {
      return latest;
    }
    if (!latest || entry.syncedAt > latest) {
      return entry.syncedAt;
    }
    return latest;
  }, null);

  return { employees, syncedAt };
}
