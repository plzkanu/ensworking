import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import type { ErpSubmission, ErpSubmissionPayload, OvertimeType } from "@/lib/types";

interface ErpSubmissionRow {
  id: string;
  overtime_type: OvertimeType;
  user_id: string;
  user_name: string;
  department: string;
  year_month: string;
  record_count: number;
  person_count: number;
  payload: ErpSubmissionPayload;
  created_at: string;
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_erp_submissions 테이블을 확인하세요.",
    );
  }
}

function mapSubmission(row: ErpSubmissionRow): ErpSubmission {
  return {
    id: row.id,
    overtimeType: row.overtime_type,
    userId: row.user_id,
    userName: row.user_name,
    department: row.department ?? "",
    yearMonth: row.year_month,
    recordCount: row.record_count,
    personCount: row.person_count,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

export async function createErpSubmission(input: {
  overtimeType: OvertimeType;
  userId: string;
  userName: string;
  department: string;
  yearMonth: string;
  recordCount: number;
  personCount: number;
  payload: ErpSubmissionPayload;
}): Promise<ErpSubmission> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_erp_submissions")
    .insert({
      overtime_type: input.overtimeType,
      user_id: input.userId,
      user_name: input.userName,
      department: input.department,
      year_month: input.yearMonth,
      record_count: input.recordCount,
      person_count: input.personCount,
      payload: input.payload,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapSubmission(data as ErpSubmissionRow);
}

export async function listErpSubmissions(options?: {
  overtimeType?: OvertimeType;
  yearMonth?: string;
  userId?: string;
  department?: string;
  limit?: number;
}): Promise<ErpSubmission[]> {
  requireSupabase();
  const supabase = createServerClient();
  const limit = Math.min(options?.limit ?? 100, 200);

  let query = supabase
    .from("ens_erp_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.overtimeType) {
    query = query.eq("overtime_type", options.overtimeType);
  }
  if (options?.yearMonth) {
    query = query.eq("year_month", options.yearMonth);
  }
  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }
  if (options?.department) {
    query = query.eq("department", options.department);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data as ErpSubmissionRow[]).map(mapSubmission);
}

export async function getErpSubmissionById(
  id: string,
): Promise<ErpSubmission | null> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_erp_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ? mapSubmission(data as ErpSubmissionRow) : null;
}
