"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  collectErpListFilterOptions,
  formatErpListFilterLabel,
  type ErpListColumnFilters,
  type ErpListColumnKey,
  type ErpSubmissionExcelRow,
} from "@/lib/erp-submission-rows";

export function ErpListFilterIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 ${active ? "text-amber-200" : "text-white/80"}`}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M1.5 2.25A.75.75 0 0 1 2.25 1.5h11.5a.75.75 0 0 1 .6 1.2L9.5 8.2v5.05a.75.75 0 0 1-1.14.64L6.1 12.72a.75.75 0 0 1-.35-.64V8.2L1.65 2.7a.75.75 0 0 1-.15-.45Z"
      />
    </svg>
  );
}

export function ErpListColumnFilterMenu({
  column,
  label,
  rows,
  filters,
  onChange,
  onClose,
  anchor,
}: {
  column: ErpListColumnKey;
  label: string;
  rows: ErpSubmissionExcelRow[];
  filters: ErpListColumnFilters;
  onChange: (column: ErpListColumnKey, selected: Set<string> | null) => void;
  onClose: () => void;
  anchor: HTMLElement;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState(() => getMenuCoords(anchor));

  const options = useMemo(
    () => collectErpListFilterOptions(rows, column),
    [rows, column],
  );
  const selected = filters[column] ?? new Set(options);
  const visibleOptions = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return options;
    }
    return options.filter((value) =>
      formatErpListFilterLabel(value).includes(q),
    );
  }, [options, query]);

  const allVisibleSelected =
    visibleOptions.length > 0 &&
    visibleOptions.every((value) => selected.has(value));

  useEffect(() => {
    function updatePosition() {
      setCoords(getMenuCoords(anchor));
    }
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || anchor.contains(target)) {
        return;
      }
      onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    function handleScroll(event: Event) {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }
      onClose();
    }

    updatePosition();
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [anchor, onClose]);

  function applySelection(next: Set<string>) {
    if (next.size === options.length && options.every((value) => next.has(value))) {
      onChange(column, null);
      return;
    }
    onChange(column, next);
  }

  function toggleAllVisible() {
    const next = new Set(selected);
    if (allVisibleSelected) {
      for (const value of visibleOptions) {
        next.delete(value);
      }
    } else {
      for (const value of visibleOptions) {
        next.add(value);
      }
    }
    applySelection(next);
  }

  function toggleValue(value: string) {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    applySelection(next);
  }

  return createPortal(
    <div
      ref={menuRef}
      role="dialog"
      aria-label={`${label} 필터`}
      className="fixed z-[200] w-64 overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-xl"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold text-slate-700">{label} 필터</p>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="값 검색"
          className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#009ada] focus:ring-2 focus:ring-[#009ada]/20"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleAllVisible}
          className="h-3.5 w-3.5 rounded border-slate-300"
        />
        전체 선택
        <span className="ml-auto text-slate-400">
          {selected.size}/{options.length}
        </span>
      </label>
      <div className="max-h-64 overflow-y-auto py-1">
        {visibleOptions.length === 0 ? (
          <p className="px-3 py-3 text-xs text-slate-500">검색 결과가 없습니다.</p>
        ) : (
          visibleOptions.map((value) => (
            <label
              key={value || "__empty"}
              className="flex cursor-pointer items-start gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.has(value)}
                onChange={() => toggleValue(value)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
              />
              <span className="min-w-0 break-all">
                {formatErpListFilterLabel(value)}
              </span>
            </label>
          ))
        )}
      </div>
    </div>,
    document.body,
  );
}

function getMenuCoords(anchor: HTMLElement): { top: number; left: number } {
  const rect = anchor.getBoundingClientRect();
  const width = 256;
  const left = Math.min(
    Math.max(8, rect.left),
    Math.max(8, window.innerWidth - width - 8),
  );
  return { top: rect.bottom + 4, left };
}
