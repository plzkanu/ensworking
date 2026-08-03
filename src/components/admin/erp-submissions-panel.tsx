"use client";

import { useEffect, useMemo, useState } from "react";
import { ErpSubmissionPivotTable } from "@/components/admin/erp-submission-pivot-table";
import { ErpSubmissionResultTable } from "@/components/admin/erp-submission-result-table";
import { inputClassName, labelClassName } from "@/components/admin/form-styles";
import type { ErpSubmissionViewScope } from "@/lib/erp-submission-access";
import {
  ERP_FORM_VERSIONS,
  getErpFormVersion,
  type ErpFormVersion,
} from "@/lib/erp-form-versions";
import { buildErpPivotModel, downloadErpPivotExcel } from "@/lib/erp-submission-pivot";
import {
  downloadErpSubmissionExcel,
  flattenSubmissionsToRows,
} from "@/lib/erp-submission-rows";
import type { ErpSubmission } from "@/lib/types";

export function ErpSubmissionsPanel() {
  const [submissions, setSubmissions] = useState<ErpSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [overtimeType, setOvertimeType] = useState("");
  const [yearMonth, setYearMonth] = useState("");
  const [department, setDepartment] = useState("");
  const [viewScope, setViewScope] = useState<ErpSubmissionViewScope>("own");
  const [departments, setDepartments] = useState<string[]>([]);
  const [fixedDepartment, setFixedDepartment] = useState("");
  const [formVersion, setFormVersion] = useState<ErpFormVersion>("list");

  const resultRows = useMemo(
    () => flattenSubmissionsToRows(submissions),
    [submissions],
  );
  const pivotModel = useMemo(
    () => buildErpPivotModel(submissions, yearMonth || undefined),
    [submissions, yearMonth],
  );

  async function loadSubmissions(filters?: {
    overtimeType?: string;
    yearMonth?: string;
    department?: string;
  }) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const type = filters?.overtimeType ?? overtimeType;
      const month = filters?.yearMonth ?? yearMonth;
      const dept = filters?.department ?? department;
      if (type) params.set("overtimeType", type);
      if (month) params.set("yearMonth", month);
      if (dept) params.set("department", dept);

      const response = await fetch(`/api/overtime/erp-submissions?${params.toString()}`);
      const data = (await response.json()) as {
        submissions?: ErpSubmission[];
        viewScope?: ErpSubmissionViewScope;
        departments?: string[];
        fixedDepartment?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "제출 내역을 불러오지 못했습니다.");
      }
      setSubmissions(data.submissions ?? []);
      if (data.viewScope) {
        setViewScope(data.viewScope);
      }
      if (data.departments) {
        setDepartments(data.departments);
      }
      if (data.fixedDepartment !== undefined) {
        setFixedDepartment(data.fixedDepartment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadExcel() {
    setDownloading(true);
    try {
      if (formVersion === "erp") {
        if (!pivotModel || pivotModel.personBlocks.length === 0) {
          return;
        }
        await downloadErpPivotExcel(pivotModel);
      } else {
        if (!resultRows.length) {
          return;
        }
        await downloadErpSubmissionExcel(resultRows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "엑셀 다운로드 실패");
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    void loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterCols =
    viewScope === "all" ? "md:grid-cols-4" : viewScope === "department" ? "md:grid-cols-4" : "md:grid-cols-3";

  const canDownload =
    formVersion === "erp"
      ? (pivotModel?.personBlocks.length ?? 0) > 0
      : resultRows.length > 0;

  const summaryText = loading
    ? "불러오는 중..."
    : formVersion === "erp"
      ? `제출 ${submissions.length}건 · 대상자 ${pivotModel?.personBlocks.length ?? 0}명 · ERP 행 ${pivotModel?.totalRows ?? 0}건`
      : `제출 ${submissions.length}건 · 근무기록 ${resultRows.length}건`;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className={`grid gap-3 ${filterCols}`}>
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
          {viewScope === "all" ? (
            <div>
              <label htmlFor="erp-department" className={labelClassName}>
                소속
              </label>
              <select
                id="erp-department"
                className={inputClassName}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">전체</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {viewScope === "department" ? (
            <div>
              <label htmlFor="erp-department-fixed" className={labelClassName}>
                소속
              </label>
              <input
                id="erp-department-fixed"
                type="text"
                className={`${inputClassName} bg-slate-50 text-slate-600`}
                value={fixedDepartment || "-"}
                readOnly
              />
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => void loadSubmissions()}
              className="rounded-lg bg-[#004b87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003a6a]"
            >
              조회
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadExcel()}
              disabled={downloading || !canDownload}
              className="rounded-lg border border-[#004b87] px-4 py-2 text-sm font-semibold text-[#004b87] hover:bg-[#004b87]/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {downloading ? "다운로드 중..." : "엑셀 다운로드"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{summaryText}</p>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {ERP_FORM_VERSIONS.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => setFormVersion(getErpFormVersion(version.id))}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                formVersion === version.id
                  ? "bg-white text-[#004b87] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {version.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
          불러오는 중...
        </p>
      ) : formVersion === "erp" ? (
        <ErpSubmissionPivotTable
          submissions={submissions}
          filterYearMonth={yearMonth || undefined}
        />
      ) : (
        <ErpSubmissionResultTable submissions={submissions} />
      )}
    </div>
  );
}
