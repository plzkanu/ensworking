import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { listRoles } from "@/lib/roles-store";
import { parseUserExcelBuffer } from "@/lib/user-excel";
import { importUsersFromExcel } from "@/lib/users-store";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "엑셀 파일을 선택해 주세요." },
        { status: 400 },
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const roles = await listRoles(true);
    const { rows, errors: parseErrors } = parseUserExcelBuffer(buffer, roles);

    if (rows.length === 0 && parseErrors.length > 0) {
      return NextResponse.json(
        {
          summary: { total: 0, created: 0, updated: 0, failed: parseErrors.length },
          results: parseErrors.map((error) => ({
            rowNumber: error.rowNumber,
            id: error.id,
            status: "failed" as const,
            message: error.message,
          })),
        },
        { status: 400 },
      );
    }

    const importResults = await importUsersFromExcel(rows);
    const combinedResults = [
      ...parseErrors.map((error) => ({
        rowNumber: error.rowNumber,
        id: error.id,
        status: "failed" as const,
        message: error.message,
      })),
      ...importResults,
    ];

    const summary = {
      total: combinedResults.length,
      created: importResults.filter((result) => result.status === "created")
        .length,
      updated: importResults.filter((result) => result.status === "updated")
        .length,
      failed:
        parseErrors.length +
        importResults.filter((result) => result.status === "failed").length,
    };

    return NextResponse.json({ summary, results: combinedResults });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "일괄 업로드에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
