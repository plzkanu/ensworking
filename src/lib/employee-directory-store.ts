import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import {
  formatDateYmd,
  getPreviousMonthFirstDay,
  isEmployeeIncludedForPreviousMonth,
} from "@/lib/employee-directory-filter";
import {
  addCalendarMonths,
  getKoreaCalendarDate,
} from "@/lib/overtime-entry-window";
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

/** updated_at(한국시간)의 전월을 `YYYY년 MM월`로 표시 */
export function formatEmployeeDirectoryBasisLabel(
  updatedAt: string | null | undefined,
): string | null {
  if (!updatedAt?.trim()) {
    return null;
  }
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const { year, month } = getKoreaCalendarDate(parsed);
  const prev = addCalendarMonths(year, month, -1);
  return `${prev.year}년 ${String(prev.month).padStart(2, "0")}월`;
}

export async function getEmployeeDirectoryBasisLabel(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employee_directory")
    .select("updated_at")
    .not("updated_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return formatEmployeeDirectoryBasisLabel(
    (data as { updated_at?: string | null } | null)?.updated_at ?? null,
  );
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

export async function listEmployeeDirectory(reference = new Date()): Promise<{
  employees: EmployeeDirectoryEntry[];
  syncedAt: string | null;
  filterBasisDate: string;
}> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  const filterBasisDate = formatDateYmd(getPreviousMonthFirstDay(reference));
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

  const employees = (data ?? [])
    .map(mapRow)
    .filter((entry) =>
      isEmployeeIncludedForPreviousMonth(entry.retireDate, reference),
    );
  const syncedAt = employees.reduce<string | null>((latest, entry) => {
    if (!entry.syncedAt) {
      return latest;
    }
    if (!latest || entry.syncedAt > latest) {
      return entry.syncedAt;
    }
    return latest;
  }, null);

  return { employees, syncedAt, filterBasisDate };
}
