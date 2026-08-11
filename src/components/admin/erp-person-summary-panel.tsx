"use client";

import {
  formatTotalHours,
  type ErpPersonSummary,
} from "@/lib/erp-submission-stats";

interface ErpPersonSummaryPanelProps {
  open: boolean;
  onClose: () => void;
  summaries: ErpPersonSummary[];
  grandTotal: {
    submissionCount: number;
    recordCount: number;
    totalHours: number;
  };
}

export function ErpPersonSummaryPanel({
  open,
  onClose,
  summaries,
  grandTotal,
}: ErpPersonSummaryPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="app-dialog-panel max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="erp-person-summary-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <h3
            id="erp-person-summary-title"
            className="text-lg font-bold text-[#004b87]"
          >
            개인별 합계
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            현재 조회 조건 기준 · 대상자 {summaries.length}명 · 근무기록{" "}
            {grandTotal.recordCount}건 · 총 {formatTotalHours(grandTotal.totalHours)}
          </p>
        </div>

        <div className="max-h-[55vh] overflow-auto px-6 py-4">
          {summaries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              표시할 개인별 합계가 없습니다.
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-2 font-medium">이름</th>
                  <th className="px-3 py-2 font-medium">부서</th>
                  <th className="px-3 py-2 font-medium">사번</th>
                  <th className="px-3 py-2 font-medium text-right">근무기록</th>
                  <th className="px-3 py-2 font-medium text-right">총 시간수</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((item) => (
                  <tr
                    key={`${item.name}|${item.department}|${item.empno}`}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {item.department}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {item.empno || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {item.recordCount}건
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[#004b87]">
                      {formatTotalHours(item.totalHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td
                    className="px-3 py-2.5 font-semibold text-slate-800"
                    colSpan={3}
                  >
                    합계
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                    {grandTotal.recordCount}건
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-[#004b87]">
                    {formatTotalHours(grandTotal.totalHours)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#3182F6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
