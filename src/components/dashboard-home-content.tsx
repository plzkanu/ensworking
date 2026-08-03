import Link from "next/link";
import { listOvertimeWindowStatuses } from "@/lib/overtime-window-store";
import { formatOvertimeWindowRangeForDisplay } from "@/lib/types";
import type { OvertimeType, OvertimeWindowStatus } from "@/lib/types";

const CARD_META: Record<
  OvertimeType,
  { href: string; icon: string; description: string }
> = {
  regular: {
    href: "/dashboard/overtime/regular",
    icon: "⏱️",
    description:
      "일반 근무 대상자의 시간외근무일지를 파싱하고 ERP 양식을 생성합니다.",
  },
  flexible: {
    href: "/dashboard/overtime/flexible",
    icon: "🔄",
    description:
      "유연근무 대상자용 도구입니다. 시간대 변환 및 ERP 제출 전 검증을 포함합니다.",
  },
};

function StatusBadge({ status }: { status: OvertimeWindowStatus }) {
  if (status.open) {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
        등록 가능
      </span>
    );
  }
  if (!status.configured || !status.enabled) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        등록 불가
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
      등록 기간 아님
    </span>
  );
}

function OvertimeCard({ status }: { status: OvertimeWindowStatus }) {
  const meta = CARD_META[status.overtimeType];
  const period = formatOvertimeWindowRangeForDisplay(status.startsAt, status.endsAt);
  const cardClassName =
    "rounded-xl border bg-white p-6 shadow-sm transition " +
    (status.open
      ? "border-slate-200 hover:border-[#009ada]/40 hover:shadow-md"
      : "border-slate-200 opacity-80");

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-[#004b87]">
          {meta.icon} {status.label}
        </h2>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-sm text-slate-500">{meta.description}</p>
      <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <p className="font-medium text-slate-800">등록 기간</p>
        <p className="mt-1">{period}</p>
        <p className="mt-2 text-xs text-slate-500">{status.message}</p>
      </div>
      {!status.open ? (
        <p className="mt-3 text-xs text-amber-700">
          현재 등록 기간이 아니어서 화면을 열 수 없습니다.
        </p>
      ) : null}
    </>
  );

  if (status.open) {
    return (
      <Link href={meta.href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

function ErpSubmissionsCard() {
  return (
    <Link
      href="/dashboard/overtime/submissions"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#009ada]/40 hover:shadow-md"
    >
      <h2 className="font-semibold text-[#004b87]">📋 ERP 제출 내역</h2>
      <p className="mt-2 text-sm text-slate-500">
        저장한 ERP 양식 데이터를 유형·연월 기준으로 조회합니다.
      </p>
    </Link>
  );
}

export async function DashboardHomeContent({
  noticeMessage,
}: {
  noticeMessage?: string;
}) {
  const windows = await listOvertimeWindowStatuses();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">시간외근무 ERP</h1>
        <p className="mt-2 text-sm text-slate-600">
          HWP 근무일지 파싱, 검증, ERP 양식 저장 및 조회를 지원합니다.
        </p>
      </div>

      {noticeMessage ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {noticeMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {windows.map((status) => (
          <OvertimeCard key={status.overtimeType} status={status} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ErpSubmissionsCard />
      </div>
    </div>
  );
}
