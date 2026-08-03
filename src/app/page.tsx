import { HomeRedirect } from "@/components/home-redirect";

/** Replit 배포 헬스체크는 / 에서 200 응답을 요구합니다. */
export default function HomePage() {
  return <HomeRedirect />;
}
