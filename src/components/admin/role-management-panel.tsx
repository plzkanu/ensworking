"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  buttonDangerClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/admin/form-styles";
import type { Role } from "@/lib/types";

interface RoleWithCount extends Role {
  userCount: number;
}

interface RoleFormState {
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

const emptyForm: RoleFormState = {
  code: "",
  name: "",
  description: "",
  sortOrder: 99,
  active: true,
};

export function RoleManagementPanel() {
  const [roles, setRoles] = useState<RoleWithCount[]>([]);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRoles() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/roles?includeInactive=true");
      const data = (await response.json()) as {
        roles?: RoleWithCount[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "역할 목록을 불러오지 못했습니다.");
      }
      setRoles(data.roles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoles();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingCode(null);
    setMessage("");
    setError("");
  }

  function startEdit(role: RoleWithCount) {
    setEditingCode(role.code);
    setForm({
      code: role.code,
      name: role.name,
      description: role.description,
      sortOrder: role.sortOrder,
      active: role.active,
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
      if (editingCode) {
        const response = await fetch(
          `/api/admin/roles/${encodeURIComponent(editingCode)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              description: form.description,
              sortOrder: form.sortOrder,
              active: form.active,
            }),
          },
        );
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "수정에 실패했습니다.");
        }
        setMessage("역할 정보가 수정되었습니다.");
      } else {
        const response = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "등록에 실패했습니다.");
        }
        setMessage("역할이 등록되었습니다.");
      }

      resetForm();
      await loadRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(code: string, name: string) {
    if (!window.confirm(`"${name}" 역할을 삭제하시겠습니까?`)) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/roles/${encodeURIComponent(code)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "삭제에 실패했습니다.");
      }
      if (editingCode === code) {
        resetForm();
      }
      setMessage("역할이 삭제되었습니다.");
      await loadRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[#004b87]">
          {editingCode ? "역할 수정" : "역할 등록"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="role-code" className={labelClassName}>
              역할 코드
            </label>
            <input
              id="role-code"
              className={inputClassName}
              value={form.code}
              disabled={!!editingCode}
              placeholder="예: office_manager"
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
            {!editingCode ? (
              <p className="mt-1 text-xs text-slate-500">
                영문 소문자로 시작, 소문자·숫자·밑줄만 사용
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="role-name" className={labelClassName}>
              역할명
            </label>
            <input
              id="role-name"
              className={inputClassName}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="role-description" className={labelClassName}>
              설명
            </label>
            <textarea
              id="role-description"
              className={`${inputClassName} min-h-[72px] resize-y`}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="role-sort-order" className={labelClassName}>
              정렬 순서
            </label>
            <input
              id="role-sort-order"
              type="number"
              className={inputClassName}
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) })
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            활성 역할
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
              {submitting ? "저장 중..." : editingCode ? "수정" : "등록"}
            </button>
            {editingCode ? (
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
          역할 목록
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : roles.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 역할이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-2 py-2 font-medium">코드</th>
                  <th className="px-2 py-2 font-medium">역할명</th>
                  <th className="px-2 py-2 font-medium">설명</th>
                  <th className="px-2 py-2 font-medium">순서</th>
                  <th className="px-2 py-2 font-medium">사용자</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                  <th className="px-2 py-2 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.code} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-mono text-xs text-slate-700">
                      {role.code}
                    </td>
                    <td className="px-2 py-2 font-medium text-slate-800">
                      {role.name}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {role.description || "-"}
                    </td>
                    <td className="px-2 py-2">{role.sortOrder}</td>
                    <td className="px-2 py-2">{role.userCount}명</td>
                    <td className="px-2 py-2">
                      {role.active ? (
                        <span className="text-emerald-600">활성</span>
                      ) : (
                        <span className="text-slate-400">비활성</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(role)}
                          className="text-[#004b87] hover:underline"
                        >
                          수정
                        </button>
                        {role.code !== "admin" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(role.code, role.name)
                            }
                            className="text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        ) : null}
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
  );
}
