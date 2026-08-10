"use client";

import { useEffect, useMemo, useState } from "react";
import { ErpSubmissionPivotTable } from "@/components/admin/erp-submission-pivot-table";
import {
  ErpSubmissionResultTable,
  ERP_LIST_DEFAULT_PAGE_SIZE,
  type ErpListPageSize,
} from "@/components/admin/erp-submission-result-table";
import { buttonDangerClassName, buttonPrimaryClassName, inputClassName, labelClassName } from "@/components/admin/form-styles";
import type { ErpSubmissionViewScope } from "@/lib/erp-submission-access";
import {
  ERP_FORM_VERSIONS,
  getErpFormVersion,
  type ErpFormVersion,
} from "@/lib/erp-form-versions";
import { buildErpPivotModel, downloadErpPivotExcel } from "@/lib/erp-submission-pivot";
import { applyDeletionsToSubmissions } from "@/lib/erp-submission-mutations";
import {
  downloadErpSubmissionExcel,
  erpRowToRecordRef,
  flattenSubmissionsToRows,
  getErpSubmissionRowKey,
} from "@/lib/erp-submission-rows";
import {
  buildDepartmentSummaries,
  buildSubmissionTotals,
  formatTotalHours,
} from "@/lib/erp-submission-stats";
import type { ErpSubmission } from "@/lib/types";
import { AppDialog } from "@/components/ui/app-dialog";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { ErpDepartmentSummaryPanel } from "@/components/admin/erp-department-summary-panel";

const filterButtonOutlineClassName =
  "shrink-0 rounded-lg border border-[#004b87] px-4 py-2 text-sm font-semibold text-[#004b87] transition hover:bg-[#004b87]/5 disabled:cursor-not-allowed disabled:opacity-40";

export function ErpSubmissionsPanel() {
  const [submissions, setSubmissions] = useState<ErpSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [overtimeType, setOvertimeType] = useState("");
  const [yearMonth, setYearMonth] = useState("");
  const [department, setDepartment] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [viewScope, setViewScope] = useState<ErpSubmissionViewScope>("own");
  const [departments, setDepartments] = useState<string[]>([]);
  const [fixedDepartment, setFixedDepartment] = useState("");
  const [formVersion, setFormVersion] = useState<ErpFormVersion>("list");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [listPageSize, setListPageSize] = useState<ErpListPageSize>(
    ERP_LIST_DEFAULT_PAGE_SIZE,
  );
  const [listPage, setListPage] = useState(1);
  const [showDepartmentSummary, setShowDepartmentSummary] = useState(false);
  const { confirm, alert, dialogProps } = useAppDialog();

  const resultRows = useMemo(
    () => flattenSubmissionsToRows(submissions),
    [submissions],
  );
  const pivotModel = useMemo(
    () => buildErpPivotModel(submissions, yearMonth || undefined),
    [submissions, yearMonth],
  );
  const submissionTotals = useMemo(
    () => buildSubmissionTotals(submissions),
    [submissions],
  );
  const departmentSummaries = useMemo(
    () => buildDepartmentSummaries(submissions),
    [submissions],
  );

  async function loadSubmissions(
    filters?: {
      overtimeType?: string;
      yearMonth?: string;
      department?: string;
      submitterName?: string;
    },
    options?: { silent?: boolean },
  ) {
    if (!options?.silent) {
      setLoading(true);
    }
    setError("");
    try {
      const params = new URLSearchParams();
      const type = filters?.overtimeType ?? overtimeType;
      const month = filters?.yearMonth ?? yearMonth;
      const dept = filters?.department ?? department;
      const submitter = filters?.submitterName ?? submitterName;
      if (type) params.set("overtimeType", type);
      if (month) params.set("yearMonth", month);
      if (dept) params.set("department", dept);
      if (submitter.trim()) params.set("submitterName", submitter.trim());

      const response = await fetch(
        `/api/overtime/erp-submissions?${params.toString()}`,
        { cache: "no-store" },
      );
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
      setSelectedRowKeys(new Set());
      setListPage(1);
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
      if (!options?.silent) {
        setLoading(false);
      }
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
        await downloadErpSubmissionExcel(resultRows, undefined, {
          includeSubmitter: viewScope === "all",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "엑셀 다운로드 실패");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDeleteSelected() {
    const selectedRows = resultRows.filter((row) =>
      selectedRowKeys.has(getErpSubmissionRowKey(row)),
    );
    if (selectedRows.length === 0) {
      return;
    }

    const confirmed = await confirm({
      title: "선택 삭제",
      message: `선택한 ${selectedRows.length}건의 근무 기록을 삭제하시겠습니까?\n삭제 내용은 ERP 양식에도 반영됩니다.`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    const recordRefs = selectedRows.map((row) => erpRowToRecordRef(row));
    try {
      const response = await fetch("/api/overtime/erp-submissions/delete-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: recordRefs }),
        cache: "no-store",
      });
      const data = (await response.json()) as {
        error?: string;
        deletedRecords?: number;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "삭제에 실패했습니다.");
      }

      setSubmissions((prev) => applyDeletionsToSubmissions(prev, recordRefs));
      setSelectedRowKeys(new Set());
      setListPage(1);
      try {
        await loadSubmissions(undefined, { silent: true });
      } catch {
        // 삭제는 완료됐고 목록은 위 optimistic update 반영 — 재조회 실패는 무시
      }
      await alert(`${data.deletedRecords ?? selectedRows.length}건 삭제되었습니다.`, {
        type: "success",
        title: "삭제 완료",
      });
    } catch (err) {
      await alert(err instanceof Error ? err.message : "삭제 실패", {
        type: "error",
        title: "삭제 실패",
      });
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    void loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSubmitterFilter = viewScope !== "own";

  const canDownload =
    formVersion === "erp"
      ? (pivotModel?.personBlocks.length ?? 0) > 0
      : resultRows.length > 0;

  const summaryText = loading
    ? "불러오는 중..."
    : formVersion === "erp"
      ? `제출 ${submissionTotals.submissionCount}건 · 대상자 ${pivotModel?.personBlocks.length ?? 0}명 · ERP 행 ${pivotModel?.totalRows ?? 0}건 · 총 ${formatTotalHours(submissionTotals.totalHours)}`
      : `제출 ${submissionTotals.submissionCount}건 · 근무기록 ${submissionTotals.recordCount}건 · 총 ${formatTotalHours(submissionTotals.totalHours)}`;

  const showDepartmentSummaryButton = viewScope === "all" && !loading;

  return (
    <>
    <AppDialog {...dialogProps} />
    <ErpDepartmentSummaryPanel
      open={showDepartmentSummary}
      onClose={() => setShowDepartmentSummary(false)}
      summaries={departmentSummaries}
      grandTotal={submissionTotals}
    />
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-nowrap items-end gap-3 overflow-x-auto">
          <div className="w-64 shrink-0">
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
          <div className="w-64 shrink-0">
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
            <div className="w-64 shrink-0">
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
            <div className="w-64 shrink-0">
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
          {showSubmitterFilter ? (
            <div className="w-64 shrink-0">
              <label htmlFor="erp-submitter" className={labelClassName}>
                등록자
              </label>
              <input
                id="erp-submitter"
                type="text"
                className={inputClassName}
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="이름으로 검색"
              />
            </div>
          ) : null}
          <div className="ml-auto flex shrink-0 items-end gap-2 pl-2">
            <button
              type="button"
              onClick={() => void loadSubmissions()}
              className={buttonPrimaryClassName}
            >
              조회
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadExcel()}
              disabled={downloading || !canDownload}
              className={filterButtonOutlineClassName}
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
        <div className="flex flex-wrap items-center gap-2">
          {showDepartmentSummaryButton ? (
            <button
              type="button"
              onClick={() => setShowDepartmentSummary(true)}
              className={filterButtonOutlineClassName}
            >
              부서별 합계
            </button>
          ) : null}
          {formVersion === "list" && resultRows.length > 0 ? (
            <button
              type="button"
              onClick={() => void handleDeleteSelected()}
              disabled={deleting || selectedRowKeys.size === 0}
              className={buttonDangerClassName}
            >
              {deleting
                ? "삭제 중..."
                : `선택 삭제${selectedRowKeys.size > 0 ? ` (${selectedRowKeys.size})` : ""}`}
            </button>
          ) : null}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {ERP_FORM_VERSIONS.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => {
                setFormVersion(getErpFormVersion(version.id));
                if (version.id !== "list") {
                  setSelectedRowKeys(new Set());
                }
              }}
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
        <ErpSubmissionResultTable
          submissions={submissions}
          showSubmitter={viewScope === "all"}
          selectable
          selectedKeys={selectedRowKeys}
          onSelectedKeysChange={setSelectedRowKeys}
          pageSize={listPageSize}
          page={listPage}
          onPageChange={setListPage}
          onPageSizeChange={(size) => {
            setListPageSize(size);
            setListPage(1);
          }}
        />
      )}
    </div>
    </>
  );
}
