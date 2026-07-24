import XLSX from "xlsx-js-style";
import type { Role } from "./types";

export const USER_EXCEL_HEADERS = [
  "아이디",
  "비밀번호",
  "사번",
  "이름",
  "직급",
  "소속",
  "역할",
  "활성",
] as const;

export interface ParsedUserExcelRow {
  rowNumber: number;
  id: string;
  password: string;
  employeeNumber: string;
  name: string;
  position: string;
  department: string;
  role: string;
  active: boolean;
}

export interface UserExcelParseError {
  rowNumber: number;
  id: string;
  message: string;
}

const HEADER_ALIASES: Record<string, keyof Omit<ParsedUserExcelRow, "rowNumber">> = {
  아이디: "id",
  id: "id",
  ID: "id",
  비밀번호: "password",
  password: "password",
  사번: "employeeNumber",
  employeenumber: "employeeNumber",
  employee_number: "employeeNumber",
  이름: "name",
  name: "name",
  직급: "position",
  position: "position",
  소속: "department",
  department: "department",
  역할: "role",
  role: "role",
  활성: "active",
  active: "active",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function parseActiveValue(value: unknown): boolean | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return true;
  if (["y", "yes", "true", "1", "예", "활성", "o"].includes(text)) return true;
  if (["n", "no", "false", "0", "아니오", "아니요", "비활성", "x"].includes(text)) {
    return false;
  }
  return null;
}

function resolveRoleCode(
  value: string,
  roles: Role[],
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const byCode = roles.find(
    (role) => role.code.toLowerCase() === trimmed.toLowerCase(),
  );
  if (byCode) return byCode.code;

  const byName = roles.find((role) => role.name === trimmed);
  if (byName) return byName.code;

  return null;
}

function isRowEmpty(values: unknown[]): boolean {
  return values.every((value) => String(value ?? "").trim() === "");
}

export function buildUserTemplateBuffer(roles: Role[]): Buffer {
  const exampleRow = [
    "hong.gildong",
    "초기비밀번호",
    "20240001",
    "홍길동",
    "대리",
    "인사팀",
    "monitoring",
    "Y",
  ];

  const userSheetData: string[][] = [
    [...USER_EXCEL_HEADERS],
    exampleRow,
    [],
    ["※ 안내"],
    ["- 아이디, 이름, 역할은 필수입니다. 신규 등록 시 비밀번호도 필수입니다."],
    ["- 역할은 '역할코드' 시트의 코드 또는 역할명을 입력할 수 있습니다."],
    ["- 활성: Y(활성) / N(비활성). 비워두면 Y로 처리됩니다."],
    ["- 동일 아이디가 이미 있으면 정보가 수정됩니다. 수정 시 비밀번호를 비우면 기존 비밀번호가 유지됩니다."],
  ];

  const roleSheetData = [
    ["역할코드", "역할명", "설명"],
    ...roles
      .filter((role) => role.active)
      .map((role) => [role.code, role.name, role.description]),
  ];

  const wb = XLSX.utils.book_new();
  const userSheet = XLSX.utils.aoa_to_sheet(userSheetData);
  userSheet["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 8 },
  ];

  const roleSheet = XLSX.utils.aoa_to_sheet(roleSheetData);
  roleSheet["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 28 }];

  XLSX.utils.book_append_sheet(wb, userSheet, "사용자");
  XLSX.utils.book_append_sheet(wb, roleSheet, "역할코드");

  const output = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;
  return output;
}

export function parseUserExcelBuffer(
  buffer: ArrayBuffer,
  roles: Role[],
): { rows: ParsedUserExcelRow[]; errors: UserExcelParseError[] } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) => name === "사용자") ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, id: "", message: "시트를 찾을 수 없습니다." }],
    };
  }

  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });

  if (table.length === 0) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, id: "", message: "데이터가 없습니다." }],
    };
  }

  const headerRow = table[0] as unknown[];
  const columnMap = new Map<number, keyof Omit<ParsedUserExcelRow, "rowNumber">>();

  headerRow.forEach((cell, index) => {
    const normalized = normalizeHeader(cell).toLowerCase();
    const key =
      HEADER_ALIASES[normalizeHeader(cell)] ??
      HEADER_ALIASES[normalized];
    if (key) {
      columnMap.set(index, key);
    }
  });

  const requiredColumns: Array<keyof Omit<ParsedUserExcelRow, "rowNumber">> = [
    "id",
    "name",
    "role",
  ];
  const missingColumns = requiredColumns.filter(
    (column) => !Array.from(columnMap.values()).includes(column),
  );

  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          id: "",
          message: `필수 열이 없습니다: ${missingColumns.join(", ")}`,
        },
      ],
    };
  }

  const rows: ParsedUserExcelRow[] = [];
  const errors: UserExcelParseError[] = [];
  const seenIds = new Map<string, number>();

  for (let i = 1; i < table.length; i += 1) {
    const rowNumber = i + 1;
    const rawRow = table[i] as unknown[];
    if (!rawRow || isRowEmpty(rawRow)) {
      continue;
    }

    const firstCell = String(rawRow[0] ?? "").trim();
    if (firstCell.startsWith("※") || firstCell.startsWith("-")) {
      continue;
    }

    const parsed: Partial<ParsedUserExcelRow> = { rowNumber };
    columnMap.forEach((field, columnIndex) => {
      parsed[field] = String(rawRow[columnIndex] ?? "").trim() as never;
    });

    const id = parsed.id?.trim() ?? "";
    const name = parsed.name?.trim() ?? "";
    const roleInput = parsed.role?.trim() ?? "";
    const password = parsed.password?.trim() ?? "";
    const activeValue = parseActiveValue(parsed.active);

    if (!id) {
      errors.push({ rowNumber, id: "", message: "아이디가 비어 있습니다." });
      continue;
    }

    if (seenIds.has(id)) {
      errors.push({
        rowNumber,
        id,
        message: `${seenIds.get(id)}행과 아이디가 중복됩니다.`,
      });
      continue;
    }
    seenIds.set(id, rowNumber);

    if (!name) {
      errors.push({ rowNumber, id, message: "이름이 비어 있습니다." });
      continue;
    }

    if (!roleInput) {
      errors.push({ rowNumber, id, message: "역할이 비어 있습니다." });
      continue;
    }

    const roleCode = resolveRoleCode(roleInput, roles);
    if (!roleCode) {
      errors.push({
        rowNumber,
        id,
        message: `역할을 찾을 수 없습니다: ${roleInput}`,
      });
      continue;
    }

    if (activeValue === null) {
      errors.push({
        rowNumber,
        id,
        message: "활성 값은 Y 또는 N으로 입력해 주세요.",
      });
      continue;
    }

    rows.push({
      rowNumber,
      id,
      password,
      employeeNumber: parsed.employeeNumber?.trim() ?? "",
      name,
      position: parsed.position?.trim() ?? "",
      department: parsed.department?.trim() ?? "",
      role: roleCode,
      active: activeValue,
    });
  }

  return { rows, errors };
}
