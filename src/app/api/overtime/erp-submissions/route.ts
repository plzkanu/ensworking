import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createErpSubmission,
  getErpSubmissionById,
  listErpSubmissions,
} from "@/lib/erp-submission-store";
import type { ErpSubmissionPayload, OvertimeType } from "@/lib/types";

function parseOvertimeType(value: string | undefined): OvertimeType | null {
  if (value === "regular" || value === "flexible") {
    return value;
  }
  return null;
}

function validatePayload(body: {
  overtimeType?: string;
  year?: number;
  month?: number;
  yearMonth?: string;
  dates?: string[];
  personBlocks?: ErpSubmissionPayload["personBlocks"];
  recordCount?: number;
  personCount?: number;
}): ErpSubmissionPayload {
  const overtimeType = parseOvertimeType(body.overtimeType);
  if (!overtimeType) {
    throw new Error("유효하지 않은 시간외근무 유형입니다.");
  }
  if (!body.yearMonth?.trim()) {
    throw new Error("대상 연월 정보가 없습니다.");
  }
  if (!Array.isArray(body.personBlocks) || body.personBlocks.length === 0) {
    throw new Error("저장할 ERP 데이터가 없습니다.");
  }

  return {
    year: Number(body.year) || 0,
    month: Number(body.month) || 0,
    yearMonth: body.yearMonth.trim(),
    dates: Array.isArray(body.dates) ? body.dates : [],
    personBlocks: body.personBlocks,
  };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      overtimeType?: string;
      year?: number;
      month?: number;
      yearMonth?: string;
      dates?: string[];
      personBlocks?: ErpSubmissionPayload["personBlocks"];
      recordCount?: number;
      personCount?: number;
    };

    const payload = validatePayload(body);
    const submission = await createErpSubmission({
      overtimeType: parseOvertimeType(body.overtimeType!)!,
      userId: user.id,
      userName: user.name,
      yearMonth: payload.yearMonth,
      recordCount: body.recordCount ?? 0,
      personCount: body.personCount ?? payload.personBlocks.length,
      payload,
    });

    return NextResponse.json({ submission });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ERP 저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const overtimeType = parseOvertimeType(
      searchParams.get("overtimeType")?.trim() || undefined,
    );
    const yearMonth = searchParams.get("yearMonth")?.trim() || undefined;
    const scope = searchParams.get("scope");
    const isAdminScope = scope === "all" && user.role === "admin";

    const submissions = await listErpSubmissions({
      overtimeType: overtimeType ?? undefined,
      yearMonth,
      userId: isAdminScope ? undefined : user.id,
      limit: isAdminScope ? 200 : 50,
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ERP 제출 내역 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
