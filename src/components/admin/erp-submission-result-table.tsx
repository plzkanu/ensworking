"use client";

import {
  ERP_EXCEL_HEADERS,
  flattenSubmissionsToRows,
  getErpRowStyleFlags,
  type ErpSubmissionExcelRow,
} from "@/lib/erp-submission-rows";
import type { ErpSubmission } from "@/lib/types";

const LIST_TABLE_HEADERS = ERP_EXCEL_HEADERS.filter((header) => header !== "요일");

function rowBackgroundClass(
  row: ErpSubmissionExcelRow,
  rowIndex: number,
): string {
  const { isNight, isHolWarn, isHolMiss } = getErpRowStyleFlags(row);
  if (isNight) {
    return "bg-[#F3E8FF]";
  }
  if (isHolWarn || isHolMiss) {
    return "bg-[#FFF8E6]";
  }
  if (rowIndex % 2 === 1) {
    return "bg-[#EBF3FE]";
  }
  return "bg-white";
}

function dayClass(dayKr: string): string {
  if (dayKr === "토") {
    return "font-semibold text-[#3182F6]";
  }
  if (dayKr === "일") {
    return "font-semibold text-[#F04452]";
  }
  return "text-slate-700";
}

export function ErpSubmissionResultTable({
  submissions,
}: {
  submissions: ErpSubmission[];
}) {
  const rows = flattenSubmissionsToRows(submissions);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
        조회된 제출 내역이 없습니다.
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#2170D8]/30 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-[13px] leading-5">
          <thead>
            <tr className="bg-[#3182F6] text-white">
              {LIST_TABLE_HEADERS.map((header) => (
                <th
                  key={header}
                  className="border border-[#2170D8] px-2 py-2 text-center font-semibold whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const flags = getErpRowStyleFlags(row);
              const bgClass = rowBackgroundClass(row, index);

              return (
                <tr key={`${row.seq}-${row.empno}-${row.date}-${row.start}`} className={bgClass}>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 text-center text-slate-700">
                    {row.seq}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 whitespace-nowrap text-slate-800">
                    {row.name}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 whitespace-nowrap text-slate-700">
                    {row.dept}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 whitespace-nowrap text-slate-700">
                    {row.empno}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 text-center whitespace-nowrap text-slate-700">
                    {row.date}
                    {row.dayKr ? (
                      <span className={dayClass(row.dayKr)}> ({row.dayKr})</span>
                    ) : null}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 text-center whitespace-nowrap text-slate-700">
                    {row.start}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 text-center whitespace-nowrap text-slate-700">
                    {row.end}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 text-center text-slate-700">
                    {row.hours}
                  </td>
                  <td
                    className={`border border-[#E2E5EA] px-2 py-1.5 whitespace-nowrap ${
                      flags.isHolidayRow
                        ? "font-semibold text-[#F04452]"
                        : "text-slate-700"
                    }`}
                  >
                    {row.workType}
                  </td>
                  <td
                    className={`border border-[#E2E5EA] px-2 py-1.5 text-center whitespace-nowrap ${
                      flags.isNight ? "font-semibold text-[#7C3AED]" : "text-slate-700"
                    }`}
                  >
                    {row.nightLabel}
                  </td>
                  <td
                    className={`border border-[#E2E5EA] px-2 py-1.5 text-center whitespace-nowrap ${
                      flags.isHolMiss
                        ? "font-semibold text-[#F04452]"
                        : flags.isHolWarn
                          ? "font-semibold text-[#D97706]"
                          : "text-slate-700"
                    }`}
                  >
                    {row.holLabel}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 text-slate-700">
                    {row.notes}
                  </td>
                  <td className="border border-[#E2E5EA] px-2 py-1.5 whitespace-nowrap text-slate-700">
                    {row.file}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
