import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import {
  parseProgramFeedbackCategory,
  parseProgramFeedbackStatus,
  type ProgramFeedbackCategory,
  type ProgramFeedbackStatus,
} from "@/lib/program-feedback";
import type { ProgramFeedbackEntry, SessionUser } from "@/lib/types";

interface ProgramFeedbackRow {
  id: string;
  user_id: string;
  user_name: string;
  user_department: string;
  category: string;
  title: string;
  content: string;
  status: string;
  admin_response: string;
  admin_id: string;
  admin_name: string;
  created_at: string;
  updated_at: string;
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. ens_program_feedbacks 테이블을 확인하세요.",
    );
  }
}

function mapFeedback(row: ProgramFeedbackRow): ProgramFeedbackEntry {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userDepartment: row.user_department,
    category: row.category as ProgramFeedbackCategory,
    title: row.title,
    content: row.content,
    status: row.status as ProgramFeedbackStatus,
    adminResponse: row.admin_response,
    adminId: row.admin_id,
    adminName: row.admin_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createProgramFeedback(input: {
  userId: string;
  userName: string;
  userDepartment: string;
  category: ProgramFeedbackCategory;
  title: string;
  content: string;
}): Promise<ProgramFeedbackEntry> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_program_feedbacks")
    .insert({
      user_id: input.userId,
      user_name: input.userName,
      user_department: input.userDepartment,
      category: input.category,
      title: input.title,
      content: input.content,
      status: "registered",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapFeedback(data as ProgramFeedbackRow);
}

export async function listProgramFeedbacks(options?: {
  userId?: string;
  limit?: number;
}): Promise<ProgramFeedbackEntry[]> {
  requireSupabase();
  const supabase = createServerClient();
  const limit = Math.min(options?.limit ?? 200, 300);

  let query = supabase
    .from("ens_program_feedbacks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data as ProgramFeedbackRow[]).map(mapFeedback);
}

export async function getProgramFeedbackById(
  id: string,
): Promise<ProgramFeedbackEntry | null> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_program_feedbacks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ? mapFeedback(data as ProgramFeedbackRow) : null;
}

export async function updateProgramFeedbackAdmin(
  id: string,
  input: {
    status: ProgramFeedbackStatus;
    adminResponse: string;
    adminId: string;
    adminName: string;
  },
): Promise<ProgramFeedbackEntry> {
  requireSupabase();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ens_program_feedbacks")
    .update({
      status: input.status,
      admin_response: input.adminResponse,
      admin_id: input.adminId,
      admin_name: input.adminName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapFeedback(data as ProgramFeedbackRow);
}

export function validateProgramFeedbackInput(body: {
  category?: string;
  title?: string;
  content?: string;
}): {
  category: ProgramFeedbackCategory;
  title: string;
  content: string;
} {
  const category = parseProgramFeedbackCategory(body.category ?? "");
  const title = body.title?.trim() ?? "";
  const content = body.content?.trim() ?? "";

  if (!category) {
    throw new Error("의견 구분을 선택해 주세요.");
  }
  if (!title) {
    throw new Error("제목을 입력해 주세요.");
  }
  if (!content) {
    throw new Error("내용을 입력해 주세요.");
  }
  if (title.length > 200) {
    throw new Error("제목은 200자 이내로 입력해 주세요.");
  }
  if (content.length > 5000) {
    throw new Error("내용은 5,000자 이내로 입력해 주세요.");
  }

  return { category, title, content };
}

export function validateProgramFeedbackAdminUpdate(body: {
  status?: string;
  adminResponse?: string;
}): {
  status: ProgramFeedbackStatus;
  adminResponse: string;
} {
  const status = parseProgramFeedbackStatus(body.status ?? "");
  const adminResponse = body.adminResponse?.trim() ?? "";

  if (!status) {
    throw new Error("유효한 상태를 선택해 주세요.");
  }
  if (adminResponse.length > 5000) {
    throw new Error("처리 내용은 5,000자 이내로 입력해 주세요.");
  }

  return { status, adminResponse };
}

export async function createProgramFeedbackFromSession(
  session: SessionUser,
  body: { category?: string; title?: string; content?: string },
): Promise<ProgramFeedbackEntry> {
  const validated = validateProgramFeedbackInput(body);
  return createProgramFeedback({
    userId: session.id,
    userName: session.name,
    userDepartment: session.department,
    ...validated,
  });
}
