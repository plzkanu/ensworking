export function formatSupabaseNetworkError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("could not find the table")) {
    return (
      "Supabase에 ens_users 테이블이 없습니다. SQL Editor에서 " +
      "supabase/migrations/001_ens_users.sql을 실행하세요."
    );
  }
  if (
    normalized.includes("fetch failed") ||
    normalized.includes("certificate") ||
    normalized.includes("ssl") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("timeout")
  ) {
    return (
      "Supabase에 연결할 수 없습니다. Replit 배포 Secrets 또는 .env.local에 " +
      "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 확인하세요. " +
      "VPN/방화벽 TLS 오류면 SUPABASE_SSL_VERIFY=0을 추가한 뒤 재배포하세요."
    );
  }
  return message;
}
