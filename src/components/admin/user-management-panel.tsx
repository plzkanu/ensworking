"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  buttonDangerClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/admin/form-styles";
import type { Role, UserPublic } from "@/lib/types";

interface RoleOption {
  code: string;
  name: string;
}

interface UserFormState {
  id: string;
  password: string;
  employeeNumber: string;
  name: string;
  position: string;
  department: string;
  role: string;
  active: boolean;
}

const emptyForm: UserFormState = {
  id: "",
  password: "",
  employeeNumber: "",
  name: "",
  position: "",
  department: "",
  role: "",
  active: true,
};

interface ImportResultItem {
  rowNumber: number;
  id: string;
  status: "created" | "updated" | "failed";
  message?: string;
}

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  failed: number;
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importResults, setImportResults] = useState<ImportResultItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/roles"),
      ]);

      const usersData = (await usersRes.json()) as {
        users?: UserPublic[];
        error?: string;
      };
      const rolesData = (await rolesRes.json()) as {
        roles?: Role[];
        error?: string;
      };

      if (!usersRes.ok) {
        throw new Error(usersData.error ?? "사용자 목록을 불러오지 못했습니다.");
      }
      if (!rolesRes.ok) {
        throw new Error(rolesData.error ?? "역할 목록을 불러오지 못했습니다.");
      }

      setUsers(usersData.users ?? []);
      const roleOptions = (rolesData.roles ?? [])
        .filter((role) => role.active)
        .map((role) => ({ code: role.code, name: role.name }));
      setRoles(roleOptions);
      if (!editingId && roleOptions.length > 0) {
        setForm((prev) => ({ ...prev, role: prev.role || roleOptions[0].code }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm({
      ...emptyForm,
      role: roles[0]?.code ?? "",
    });
    setEditingId(null);
    setMessage("");
    setError("");
  }

  function startEdit(user: UserPublic) {
    setEditingId(user.id);
    setForm({
      id: user.id,
      password: "",
      employeeNumber: user.employeeNumber,
      name: user.name,
      position: user.position,
      department: user.department,
      role: user.role,
      active: user.active,
    });
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        const body: Record<string, unknown> = {
          employeeNumber: form.employeeNumber,
          name: form.name,
          position: form.position,
          department: form.department,
          role: form.role,
          active: form.active,
        };
        if (form.password.trim()) {
          body.password = form.password;
        }

        const response = await fetch(`/api/admin/users/${encodeURIComponent(editingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "수정에 실패했습니다.");
        }
        setMessage("사용자 정보가 수정되었습니다.");
      } else {
        if (!form.password.trim()) {
          throw new Error("비밀번호를 입력해 주세요.");
        }

        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "등록에 실패했습니다.");
        }
        setMessage("사용자가 등록되었습니다.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`"${name}" 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "삭제에 실패했습니다.");
      }
      if (editingId === id) {
        resetForm();
      }
      setMessage("사용자가 삭제되었습니다.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    }
  }

  function roleLabel(code: string) {
    return roles.find((role) => role.code === code)?.name ?? code;
  }

  async function handleImport(file: File) {
    setImporting(true);
    setError("");
    setMessage("");
    setImportSummary(null);
    setImportResults([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/users/import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        summary?: ImportSummary;
        results?: ImportResultItem[];
        error?: string;
      };

      if (!response.ok && !data.summary) {
        throw new Error(data.error ?? "일괄 업로드에 실패했습니다.");
      }

      if (data.summary && data.results) {
        setImportSummary(data.summary);
        setImportResults(data.results);
        const { created, updated, failed } = data.summary;
        setMessage(
          `일괄 업로드 완료: 등록 ${created}건, 수정 ${updated}건, 실패 ${failed}건`,
        );
        if (created > 0 || updated > 0) {
          await loadData();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 업로드 중 오류가 발생했습니다.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void handleImport(file);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-[#004b87]">
          엑셀 일괄 등록
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          양식을 내려받아 작성한 뒤 업로드하면 사용자를 한 번에 등록·수정할 수
          있습니다.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/admin/users/template"
            className={buttonSecondaryClassName}
          >
            양식 다운로드
          </a>
          <label className={`${buttonPrimaryClassName} cursor-pointer`}>
            {importing ? "업로드 중..." : "엑셀 업로드"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={importing}
              onChange={handleFileChange}
            />
          </label>
        </div>

        {importSummary ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-800">
              처리 결과: 총 {importSummary.total}건 · 등록{" "}
              {importSummary.created} · 수정 {importSummary.updated} · 실패{" "}
              {importSummary.failed}
            </p>
            {importResults.some((result) => result.status === "failed") ? (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-2 py-1.5 font-medium">행</th>
                      <th className="px-2 py-1.5 font-medium">아이디</th>
                      <th className="px-2 py-1.5 font-medium">오류</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults
                      .filter((result) => result.status === "failed")
                      .map((result) => (
                        <tr
                          key={`${result.rowNumber}-${result.id}`}
                          className="border-b border-slate-100"
                        >
                          <td className="px-2 py-1.5">{result.rowNumber}</td>
                          <td className="px-2 py-1.5">{result.id || "-"}</td>
                          <td className="px-2 py-1.5 text-red-600">
                            {result.message}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[#004b87]">
          {editingId ? "사용자 수정" : "사용자 등록"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="user-id" className={labelClassName}>
              아이디
            </label>
            <input
              id="user-id"
              className={inputClassName}
              value={form.id}
              disabled={!!editingId}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="user-password" className={labelClassName}>
              비밀번호{editingId ? " (변경 시에만 입력)" : ""}
            </label>
            <input
              id="user-password"
              type="password"
              className={inputClassName}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingId}
            />
          </div>

          <div>
            <label htmlFor="user-employee-number" className={labelClassName}>
              사번
            </label>
            <input
              id="user-employee-number"
              className={inputClassName}
              value={form.employeeNumber}
              onChange={(e) =>
                setForm({ ...form, employeeNumber: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="user-name" className={labelClassName}>
              이름
            </label>
            <input
              id="user-name"
              className={inputClassName}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="user-position" className={labelClassName}>
              직급
            </label>
            <input
              id="user-position"
              className={inputClassName}
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="user-department" className={labelClassName}>
              소속
            </label>
            <input
              id="user-department"
              className={inputClassName}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="user-role" className={labelClassName}>
              역할
            </label>
            <select
              id="user-role"
              className={inputClassName}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              {roles.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            활성 계정
          </label>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className={buttonPrimaryClassName}
            >
              {submitting ? "저장 중..." : editingId ? "수정" : "등록"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className={buttonSecondaryClassName}
              >
                취소
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[#004b87]">
          사용자 목록
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 사용자가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-2 py-2 font-medium">아이디</th>
                  <th className="px-2 py-2 font-medium">사번</th>
                  <th className="px-2 py-2 font-medium">이름</th>
                  <th className="px-2 py-2 font-medium">직급</th>
                  <th className="px-2 py-2 font-medium">소속</th>
                  <th className="px-2 py-2 font-medium">역할</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                  <th className="px-2 py-2 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">
                      {user.id}
                    </td>
                    <td className="px-2 py-2">{user.employeeNumber || "-"}</td>
                    <td className="px-2 py-2">{user.name}</td>
                    <td className="px-2 py-2">{user.position || "-"}</td>
                    <td className="px-2 py-2">{user.department || "-"}</td>
                    <td className="px-2 py-2">{roleLabel(user.role)}</td>
                    <td className="px-2 py-2">
                      {user.active ? (
                        <span className="text-emerald-600">활성</span>
                      ) : (
                        <span className="text-slate-400">비활성</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="text-[#004b87] hover:underline"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(user.id, user.name)}
                          className="text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
