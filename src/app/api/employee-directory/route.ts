import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listEmployeeDirectory } from "@/lib/employee-directory-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { employees, syncedAt } = await listEmployeeDirectory();
    return NextResponse.json({
      employees,
      count: employees.length,
      syncedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사원명부 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
