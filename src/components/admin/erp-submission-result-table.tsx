"use client";

import { useMemo } from "react";
import {
  flattenSubmissionsToRows,
  formatErpSubmitter,
  getErpListTableHeaders,
  getErpRowStyleFlags,
  getErpSubmissionRowKey,
  type ErpSubmissionExcelRow,
} from "@/lib/erp-submission-rows";
import type { ErpSubmission } from "@/lib/types";

export const ERP_LIST_PAGE_SIZE_OPTIONS = [30, 50, 100, 200] as const;
export type ErpListPageSize = (typeof ERP_LIST_PAGE_SIZE_OPTIONS)[number];
export const ERP_LIST_DEFAULT_PAGE_SIZE: ErpListPageSize = 50;

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
  showSubmitter = false,
  selectable = false,
  selectedKeys,
  onSelectedKeysChange,
  pageSize = ERP_LIST_DEFAULT_PAGE_SIZE,
  page = 1,
  onPageChange,
  onPageSizeChange,
}: {
  submissions: ErpSubmission[];
  showSubmitter?: boolean;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectedKeysChange?: (keys: Set<string>) => void;
  pageSize?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: ErpListPageSize) => void;
}) {
  const rows = flattenSubmissionsToRows(submissions);
  const tableHeaders = getErpListTableHeaders(showSubmitter);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedRows = rows.slice(pageStart, pageStart + pageSize);
  const pageRowKeys = useMemo(
    () => paginatedRows.map((row) => getErpSubmissionRowKey(row)),
    [paginatedRows],
  );
  const allSelected =
    selectable &&
    paginatedRows.length > 0 &&
    pageRowKeys.every((key) => selectedKeys?.has(key));

  function toggleRow(row: ErpSubmissionExcelRow) {
    if (!onSelectedKeysChange || !selectedKeys) {
      return;
    }
    const key = getErpSubmissionRowKey(row);
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onSelectedKeysChange(next);
  }

  function toggleAll() {
    if (!onSelectedKeysChange || !selectedKeys) {
      return;
    }
    const next = new Set(selectedKeys);
    if (allSelected) {
      for (const key of pageRowKeys) {
        next.delete(key);
      }
    } else {
      for (const key of pageRowKeys) {
        next.add(key);
      }
    }
    onSelectedKeysChange(next);
  }

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
              {selectable ? (
                <th className="border border-[#2170D8] px-2 py-2 text-center font-semibold w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="전체 선택"
                    className="h-4 w-4 rounded border-white/40"
                  />
                </th>
              ) : null}
              {tableHeaders.map((header) => (
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
            {paginatedRows.map((row, index) => {
              const flags = getErpRowStyleFlags(row);
              const bgClass = rowBackgroundClass(row, index);
              const rowKey = getErpSubmissionRowKey(row);
              const checked = selectedKeys?.has(rowKey) ?? false;

              return (
                <tr key={rowKey} className={bgClass}>
                  {selectable ? (
                    <td className="border border-[#E2E5EA] px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRow(row)}
                        aria-label={`${row.name} ${row.date} 선택`}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                  ) : null}
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
                  {showSubmitter ? (
                    <td className="border border-[#E2E5EA] px-2 py-1.5 whitespace-nowrap text-slate-700">
                      {formatErpSubmitter(row)}
                    </td>
                  ) : null}
                  <td className="border border-[#E2E5EA] px-2 py-1.5 whitespace-nowrap text-slate-700">
                    {row.file}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p>
          전체 {rows.length.toLocaleString()}건 중{" "}
          {rows.length === 0
            ? "0"
            : `${(pageStart + 1).toLocaleString()}-${Math.min(pageStart + pageSize, rows.length).toLocaleString()}`}
          건 표시
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="whitespace-nowrap text-slate-600">표시 개수</span>
            <select
              value={pageSize}
              onChange={(e) =>
                onPageSizeChange?.(Number(e.target.value) as ErpListPageSize)
              }
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-[#009ada] focus:ring-2 focus:ring-[#009ada]/20"
            >
              {ERP_LIST_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}개
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange?.(safePage - 1)}
              disabled={safePage <= 1}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            <span className="min-w-[4.5rem] text-center tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange?.(safePage + 1)}
              disabled={safePage >= totalPages}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
