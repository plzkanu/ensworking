"use client";

import {
  buildErpPivotModel,
  getPivotBlockRowCount,
  getPivotFixedHeaders,
  getPivotSubHeaders,
} from "@/lib/erp-submission-pivot";
import type { ErpSubmission, ErpSubmissionDayEntry } from "@/lib/types";

const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"] as const;

const FIXED_COL_WIDTHS = ["w-[92px]", "w-[84px]", "w-[180px]", "w-[96px]"] as const;

const TABLE_TEXT = "text-[13px] leading-5";
const CELL_PAD = "px-2 py-1.5";

const HEADER_TITLE_H = "h-10";
const HEADER_DATE_H = "h-10";
const HEADER_SUB_H = "h-10";
const HEADER_CELL = "align-middle box-border";

function formatDateHeader(date: string, month: number) {
  const dt = new Date(`${date}T00:00:00`);
  const day = dt.getDate();
  const dayKr = DAY_KR[dt.getDay()] ?? "";
  return { label: `${month}/${day}`, dayKr, dow: dt.getDay() };
}

function dayTone(dow: number) {
  if (dow === 0) {
    return "text-rose-500";
  }
  if (dow === 6) {
    return "text-sky-600";
  }
  return "text-slate-600";
}

function CheckBadge({ active, tone }: { active: boolean; tone: "night" | "holiday" }) {
  if (!active) {
    return <span className="text-slate-300">·</span>;
  }

  const toneClass =
    tone === "night"
      ? "bg-violet-100 text-violet-700 ring-violet-200/80"
      : "bg-amber-100 text-amber-700 ring-amber-200/80";

  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ring-1 ${toneClass}`}
    >
      ✓
    </span>
  );
}

function TimeCell({
  value,
  align = "left",
  emphasis = false,
}: {
  value: string | number;
  align?: "left" | "center" | "right";
  emphasis?: boolean;
}) {
  const hasValue = value !== "" && value !== 0;
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <td
      className={`border-b border-slate-100 ${CELL_PAD} tabular-nums align-middle ${alignClass} ${
        hasValue
          ? emphasis
            ? "bg-[#009ada]/8 font-semibold text-[#004b87]"
            : "bg-sky-50/70 text-slate-800"
          : "bg-slate-50/40 text-slate-300"
      }`}
    >
      {hasValue ? value : "—"}
    </td>
  );
}

function renderDateCells(entry?: ErpSubmissionDayEntry) {
  if (!entry) {
    return (
      <>
        <TimeCell value="" />
        <TimeCell value="" />
        <TimeCell value="" align="right" />
        <td className={`border-b border-slate-100 bg-slate-50/40 ${CELL_PAD} text-center align-middle`}>
          <span className="text-slate-300">·</span>
        </td>
        <td className={`border-b border-slate-100 bg-slate-50/40 ${CELL_PAD} text-center align-middle`}>
          <span className="text-slate-300">·</span>
        </td>
      </>
    );
  }

  return (
    <>
      <TimeCell value={entry.start || ""} />
      <TimeCell value={entry.end || ""} />
      <TimeCell value={entry.hours ?? ""} align="right" emphasis />
      <td className={`border-b border-slate-100 bg-white ${CELL_PAD} text-center align-middle`}>
        <CheckBadge active={!!entry.night_work} tone="night" />
      </td>
      <td className={`border-b border-slate-100 bg-white ${CELL_PAD} text-center align-middle`}>
        <CheckBadge active={!!entry.holiday_early} tone="holiday" />
      </td>
    </>
  );
}

export function ErpSubmissionPivotTable({
  submissions,
  filterYearMonth,
}: {
  submissions: ErpSubmission[];
  filterYearMonth?: string;
}) {
  const model = buildErpPivotModel(submissions, filterYearMonth);

  if (!model || model.personBlocks.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
        조회된 제출 내역이 없습니다.
      </p>
    );
  }

  const { context, personBlocks } = model;
  const { dates, month, yearMonth } = context;
  const subHeaders = getPivotSubHeaders();
  const fixedHeaders = getPivotFixedHeaders();
  const [yearText, monthText] = yearMonth.split("-");

  const dataRows = personBlocks.flatMap((block, blockIndex) => {
    const rowCount = getPivotBlockRowCount(block);
    return Array.from({ length: rowCount }, (_, slotIndex) => ({
      key: `${block.empno}-${block.name}-${slotIndex}`,
      block,
      blockIndex,
      slotIndex,
      entries: block.slots[slotIndex] ?? {},
      isGroupStart: slotIndex === 0,
    }));
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#004b87] to-[#0066a8] px-5 py-3 text-white">
        <div>
          <p className="text-base font-semibold tracking-tight">시간외근무신청 (ERP)</p>
          <p className="mt-0.5 text-xs text-white/75">피벗 양식 · 기본정보 고정 · 날짜별 시간대</p>
        </div>
        <div className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-sm">
          {yearText}년 {Number(monthText)}월
        </div>
      </div>

      <div className="flex">
        <div className="shrink-0 border-r border-slate-200 bg-slate-50/40">
          <table className={`table-fixed border-collapse ${TABLE_TEXT}`}>
            <colgroup>
              {FIXED_COL_WIDTHS.map((width) => (
                <col key={width} className={width} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  colSpan={4}
                  className={`${HEADER_TITLE_H} ${HEADER_CELL} border-b border-slate-200 bg-slate-100/80 px-3 text-left font-semibold tracking-wide text-slate-500 uppercase`}
                >
                  기본정보
                </th>
              </tr>
              <tr>
                <th
                  colSpan={4}
                  className={`${HEADER_DATE_H} ${HEADER_CELL} border-b border-slate-200 bg-white`}
                  aria-hidden="true"
                >
                  <span className="sr-only">날짜</span>
                </th>
              </tr>
              <tr>
                {fixedHeaders.map((header) => (
                  <th
                    key={header}
                    className={`${HEADER_SUB_H} ${HEADER_CELL} border-b border-slate-200 bg-slate-50 ${CELL_PAD} text-center font-semibold text-[#004b87]`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map(({ key, block, isGroupStart, blockIndex }, rowIndex) => (
                <tr
                  key={key}
                  className={`transition-colors hover:bg-[#009ada]/5 ${
                    rowIndex % 2 === 1 ? "bg-white" : "bg-slate-50/70"
                  } ${isGroupStart && blockIndex > 0 ? "border-t border-slate-200" : ""}`}
                >
                  <td className={`border-b border-slate-100 ${CELL_PAD} font-semibold text-slate-900`}>
                    {block.name}
                  </td>
                  <td className={`border-b border-slate-100 ${CELL_PAD} font-mono text-slate-600`}>
                    {block.empno}
                  </td>
                  <td
                    className={`border-b border-slate-100 ${CELL_PAD} text-slate-600`}
                    title={block.dept}
                  >
                    <span className="block truncate">{block.dept}</span>
                  </td>
                  <td className={`border-b border-slate-100 ${CELL_PAD} text-slate-500`}>
                    {block.workType || "직원(기본)"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <table className={`min-w-max border-collapse ${TABLE_TEXT}`}>
            <thead className="sticky top-0 z-10">
              <tr>
                <th
                  colSpan={dates.length * subHeaders.length}
                  className={`${HEADER_TITLE_H} ${HEADER_CELL} border-b border-slate-200 bg-slate-100/80 px-4 text-left font-semibold tracking-wide text-slate-500 uppercase`}
                >
                  근무일자
                </th>
              </tr>
              <tr>
                {dates.map((date) => {
                  const { label, dayKr, dow } = formatDateHeader(date, month);
                  return (
                    <th
                      key={`date-${date}`}
                      colSpan={subHeaders.length}
                      className={`${HEADER_DATE_H} ${HEADER_CELL} border-b border-r border-slate-200 bg-white px-1 text-center whitespace-nowrap last:border-r-0`}
                    >
                      <span className="font-semibold text-slate-800">{label}</span>
                      {dayKr ? (
                        <span className={`font-semibold ${dayTone(dow)}`}> ({dayKr})</span>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {dates.flatMap((date) =>
                  subHeaders.map((header, index) => (
                    <th
                      key={`${date}-${header}`}
                      className={`${HEADER_SUB_H} ${HEADER_CELL} min-w-[72px] border-b border-r border-slate-200 bg-slate-50 px-1.5 text-center font-medium text-slate-500 last:border-r-0 ${
                        index === 0 ? "border-l border-l-slate-200/70" : ""
                      }`}
                    >
                      {header}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {dataRows.map(({ key, entries, isGroupStart, blockIndex }, rowIndex) => (
                <tr
                  key={key}
                  className={`transition-colors hover:bg-[#009ada]/5 ${
                    rowIndex % 2 === 1 ? "bg-white" : "bg-slate-50/70"
                  } ${isGroupStart && blockIndex > 0 ? "border-t border-slate-200" : ""}`}
                >
                  {dates.map((date) => (
                    <FragmentRow key={`${key}-${date}`} entry={entries[date]} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function FragmentRow({ entry }: { entry?: ErpSubmissionDayEntry }) {
  return <>{renderDateCells(entry)}</>;
}
