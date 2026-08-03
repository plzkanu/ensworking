import { DashboardHomeContent } from "@/components/dashboard-home-content";

interface DashboardHomePageProps {
  searchParams: Promise<{
    overtime_closed?: string;
    message?: string;
  }>;
}

export default async function DashboardHomePage({
  searchParams,
}: DashboardHomePageProps) {
  const params = await searchParams;
  const noticeMessage = params.message
    ? decodeURIComponent(params.message)
    : params.overtime_closed
      ? "등록 기간이 아니어서 해당 화면을 열 수 없습니다."
      : undefined;

  return <DashboardHomeContent noticeMessage={noticeMessage} />;
}
