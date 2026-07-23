import { isSupabaseTlsInsecure } from "./config";

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
      "Supabase에 연결할 수 없습니다. 회사 VPN/방화벽 환경이면 .env.local에 " +
      "SUPABASE_SSL_VERIFY=0을 추가한 뒤 개발 서버를 재시작하세요."
    );
  }
  return message;
}

let supabaseTlsBypassApplied = false;

export function applySupabaseTlsBypassIfConfigured(): void {
  if (supabaseTlsBypassApplied || !isSupabaseTlsInsecure()) {
    return;
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  supabaseTlsBypassApplied = true;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[supabase] SUPABASE_SSL_VERIFY=0 — TLS 인증서 검증을 생략합니다.",
    );
  }
}
