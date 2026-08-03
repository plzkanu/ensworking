"use client";

import { useEffect, useState } from "react";
import { inputClassName, labelClassName } from "@/components/admin/form-styles";
import type { ErpSubmission, OvertimeType } from "@/lib/types";

const TYPE_LABELS: Record<OvertimeType, string> = {
  regular: "일반",
  flexible: "유연",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function countFilledDays(block: ErpSubmission["payload"]["personBlocks"][number]) {
  return block.slots.reduce((total, slot) => total + Object.keys(slot).length, 0);
}

export function ErpSubmissionsPanel({ adminView = false }: { adminView?: boolean }) {
  const [submissions, setSubmissions] = useState<ErpSubmission[]>([]);
  const [selected, setSelected] = useState<ErpSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overtimeType, setOvertimeType] = useState("");
  const [yearMonth, setYearMonth] = useState("");

  async function loadSubmissions(filters?: {
    overtimeType?: string;
    yearMonth?: string;
  }) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const type = filters?.overtimeType ?? overtimeType;
      const month = filters?.yearMonth ?? yearMonth;
      if (type) params.set("overtimeType", type);
      if (month) params.set("yearMonth", month);
      if (adminView) params.set("scope", "all");

      const response = await fetch(`/api/overtime/erp-submissions?${params.toString()}`);
      const data = (await response.json()) as {
        submissions?: ErpSubmission[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "제출 내역을 불러오지 못했습니다.");
      }
      setSubmissions(data.submissions ?? []);
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="erp-type" className={labelClassName}>
              유형
            </label>
            <select
              id="erp-type"
              className={inputClassName}
              value={overtimeType}
              onChange={(e) => setOvertimeType(e.target.value)}
            >
              <option value="">전체</option>
              <option value="regular">일반</option>
              <option value="flexible">유연</option>
            </select>
          </div>
          <div>
            <label htmlFor="erp-month" className={labelClassName}>
              대상 연월
            </label>
            <input
              id="erp-month"
              type="month"
              className={inputClassName}
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void loadSubmissions()}
              className="rounded-lg bg-[#004b87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003a6a]"
            >
              조회
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#004b87]">제출 목록</h2>
          {loading ? (
            <p className="text-sm text-slate-500">불러오는 중...</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-slate-500">조회된 제출 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-2 py-2 font-medium">제출일시</th>
                    {adminView ? (
                      <th className="px-2 py-2 font-medium">제출자</th>
                    ) : null}
                    <th className="px-2 py-2 font-medium">유형</th>
                    <th className="px-2 py-2 font-medium">연월</th>
                    <th className="px-2 py-2 font-medium">인원</th>
                    <th className="px-2 py-2 font-medium">건수</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                        selected?.id === item.id ? "bg-[#009ada]/5" : ""
                      }`}
                      onClick={() => setSelected(item)}
                    >
                      <td className="px-2 py-2 whitespace-nowrap">
                        {formatDateTime(item.createdAt)}
                      </td>
                      {adminView ? (
                        <td className="px-2 py-2">
                          <div>{item.userName}</div>
                          <div className="text-xs text-slate-400">{item.userId}</div>
                        </td>
                      ) : null}
                      <td className="px-2 py-2">
                        {TYPE_LABELS[item.overtimeType]}
                      </td>
                      <td className="px-2 py-2">{item.yearMonth}</td>
                      <td className="px-2 py-2">{item.personCount}</td>
                      <td className="px-2 py-2">{item.recordCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#004b87]">상세 내용</h2>
          {!selected ? (
            <p className="text-sm text-slate-500">목록에서 항목을 선택하세요.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <p>
                  {TYPE_LABELS[selected.overtimeType]} · {selected.yearMonth}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  제출: {formatDateTime(selected.createdAt)}
                  {adminView
                    ? ` · ${selected.userName} (${selected.userId})`
                    : ""}
                </p>
              </div>

              <div className="max-h-[520px] overflow-auto">
                {selected.payload.personBlocks.map((block) => (
                  <div
                    key={`${block.empno}-${block.name}`}
                    className="mb-4 rounded-lg border border-slate-200 p-3"
                  >
                    <p className="font-medium text-slate-800">
                      {block.name} ({block.empno})
                    </p>
                    <p className="text-xs text-slate-500">
                      {block.dept || "-"} · 입력일 {countFilledDays(block)}건
                    </p>
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="px-2 py-1">날짜</th>
                            <th className="px-2 py-1">시작</th>
                            <th className="px-2 py-1">종료</th>
                            <th className="px-2 py-1">시간</th>
                            <th className="px-2 py-1">야간</th>
                            <th className="px-2 py-1">휴일조기</th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.slots.flatMap((slot, slotIndex) =>
                            Object.entries(slot).map(([date, entry]) => (
                              <tr
                                key={`${block.empno}-${date}-${slotIndex}`}
                                className="border-b border-slate-100"
                              >
                                <td className="px-2 py-1 whitespace-nowrap">
                                  {date}
                                </td>
                                <td className="px-2 py-1">{entry.start || "-"}</td>
                                <td className="px-2 py-1">{entry.end || "-"}</td>
                                <td className="px-2 py-1">{entry.hours ?? 0}</td>
                                <td className="px-2 py-1">
                                  {entry.night_work ? "Y" : "-"}
                                </td>
                                <td className="px-2 py-1">
                                  {entry.holiday_early ? "Y" : "-"}
                                </td>
                              </tr>
                            )),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
