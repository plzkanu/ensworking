"use client";

import type { OvertimeVariant } from "@/lib/overtime-types";

interface OvertimeToolFrameProps {
  variant: OvertimeVariant;
}

export function OvertimeToolFrame({ variant }: OvertimeToolFrameProps) {
  const src = `/overtime/${variant}/index.html`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <iframe
        title={variant === "regular" ? "시간외근무 (일반)" : "시간외근무 (유연)"}
        src={src}
        className="h-[calc(100vh-12rem)] w-full min-h-[720px] border-0"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-popups"
      />
    </div>
  );
}
