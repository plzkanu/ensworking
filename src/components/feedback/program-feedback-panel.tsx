"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/admin/form-styles";
import {
  PROGRAM_FEEDBACK_CATEGORIES,
  PROGRAM_FEEDBACK_STATUSES,
  programFeedbackCategoryLabel,
  programFeedbackStatusClassName,
  programFeedbackStatusLabel,
} from "@/lib/program-feedback";
import type { ProgramFeedbackEntry } from "@/lib/types";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

export function ProgramFeedbackPanel() {
  const [feedbacks, setFeedbacks] = useState<ProgramFeedbackEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editResponse, setEditResponse] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  async function loadFeedbacks() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/feedback");
      const data = (await response.json()) as {
        feedbacks?: ProgramFeedbackEntry[];
        isAdmin?: boolean;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "의견 목록을 불러오지 못했습니다.");
      }
      setFeedbacks(data.feedbacks ?? []);
      setIsAdmin(Boolean(data.isAdmin));
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, content }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "의견 등록에 실패했습니다.");
      }
      setCategory("");
      setTitle("");
      setContent("");
      setMessage("의견이 등록되었습니다.");
      await loadFeedbacks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setSubmitting(false);
    }
  }

  function startAdminEdit(feedback: ProgramFeedbackEntry) {
    setEditingId(feedback.id);
    setEditStatus(feedback.status);
    setEditResponse(feedback.adminResponse);
  }

  function cancelAdminEdit() {
    setEditingId(null);
    setEditStatus("");
    setEditResponse("");
  }

  async function handleAdminSave(feedbackId: string) {
    setSavingAdmin(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/feedback/${encodeURIComponent(feedbackId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          adminResponse: editResponse,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "처리 저장에 실패했습니다.");
      }
      setMessage("처리 내용이 저장되었습니다.");
      cancelAdminEdit();
      await loadFeedbacks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSavingAdmin(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-[#004b87]">의견 제출</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="feedback-category" className={labelClassName}>
                구분
              </label>
              <select
                id="feedback-category"
                className={inputClassName}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={submitting}
              >
                <option value="">선택</option>
                {PROGRAM_FEEDBACK_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="feedback-title" className={labelClassName}>
                제목
              </label>
              <input
                id="feedback-title"
                type="text"
                className={inputClassName}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요."
                required
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label htmlFor="feedback-content" className={labelClassName}>
              내용
            </label>
            <textarea
              id="feedback-content"
              rows={6}
              className={`${inputClassName} resize-y min-h-[140px]`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="수정요청, 기능개선, 오류신고 내용을 입력하세요."
              required
              disabled={submitting}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className={buttonPrimaryClassName}
              disabled={submitting}
            >
              {submitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </section>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-[#004b87]">
            {isAdmin ? "전체 의견 목록" : "내 의견 목록"}
          </h2>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">불러오는 중...</p>
        ) : feedbacks.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            등록된 의견이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {feedbacks.map((feedback) => {
              const isEditing = editingId === feedback.id;
              return (
                <li key={feedback.id} className="px-5 py-4">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${programFeedbackStatusClassName(feedback.status)}`}
                        >
                          {programFeedbackStatusLabel(feedback.status)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {programFeedbackCategoryLabel(feedback.category)}
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-slate-900">
                        {feedback.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(feedback.createdAt)}
                        {isAdmin
                          ? ` · ${feedback.userName}${feedback.userDepartment ? `(${feedback.userDepartment})` : ""}`
                          : ""}
                      </p>
                    </div>
                    {isAdmin && !isEditing ? (
                      <button
                        type="button"
                        className={`${buttonSecondaryClassName} px-3 py-1.5 text-xs`}
                        onClick={() => startAdminEdit(feedback)}
                      >
                        처리
                      </button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {feedback.content}
                  </p>
                  {feedback.adminResponse && !isEditing ? (
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs font-medium text-slate-500">처리 내용</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {feedback.adminResponse}
                      </p>
                      {feedback.adminName ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {feedback.adminName} · {formatDateTime(feedback.updatedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {isAdmin && isEditing ? (
                    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <label htmlFor={`status-${feedback.id}`} className={labelClassName}>
                          상태
                        </label>
                        <select
                          id={`status-${feedback.id}`}
                          className={inputClassName}
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          disabled={savingAdmin}
                        >
                          {PROGRAM_FEEDBACK_STATUSES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`response-${feedback.id}`} className={labelClassName}>
                          처리 내용
                        </label>
                        <textarea
                          id={`response-${feedback.id}`}
                          rows={4}
                          className={`${inputClassName} resize-y min-h-[100px]`}
                          value={editResponse}
                          onChange={(e) => setEditResponse(e.target.value)}
                          placeholder="조치·답변 내용을 입력하세요."
                          disabled={savingAdmin}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={buttonSecondaryClassName}
                          onClick={cancelAdminEdit}
                          disabled={savingAdmin}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className={buttonPrimaryClassName}
                          onClick={() => void handleAdminSave(feedback.id)}
                          disabled={savingAdmin}
                        >
                          {savingAdmin ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
