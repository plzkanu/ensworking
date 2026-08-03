import https from "node:https";
import { isSupabaseTlsInsecure } from "./config";

let cachedFetch: typeof fetch | undefined;
let tlsBypassNoticeLogged = false;

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function logTlsBypassNotice() {
  if (tlsBypassNoticeLogged || process.env.NODE_ENV === "production") {
    return;
  }
  tlsBypassNoticeLogged = true;
  console.warn(
    "[supabase] SUPABASE_SSL_VERIFY=0 — Supabase 요청만 TLS 검증을 생략합니다.",
  );
}

function headersToRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

async function readRequestBody(
  body: BodyInit | null | undefined,
): Promise<string | Buffer | undefined> {
  if (body == null) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (typeof body === "object" && "getReader" in body) {
    const reader = (body as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
  return undefined;
}

function insecureHttpsFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    void (async () => {
      try {
        const request = input instanceof Request ? input : null;
        const url = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
        );
        const method = init?.method ?? request?.method ?? "GET";
        const headers = headersToRecord(init?.headers ?? request?.headers);
        const payload = await readRequestBody(init?.body ?? request?.body ?? null);

        const req = https.request(
          {
            hostname: url.hostname,
            port: url.port || 443,
            path: `${url.pathname}${url.search}`,
            method,
            headers,
            agent: insecureAgent,
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
              resolve(
                new Response(Buffer.concat(chunks), {
                  status: res.statusCode ?? 500,
                  statusText: res.statusMessage,
                  headers: res.headers as HeadersInit,
                }),
              );
            });
          },
        );

        req.on("error", reject);
        if (payload !== undefined) {
          req.write(payload);
        }
        req.end();
      } catch (error) {
        reject(error);
      }
    })();
  });
}

/** Supabase 클라이언트 전용 fetch (전역 TLS 설정 변경 없음) */
export function getSupabaseFetch(): typeof fetch | undefined {
  if (!isSupabaseTlsInsecure()) {
    return undefined;
  }
  if (!cachedFetch) {
    cachedFetch = insecureHttpsFetch as typeof fetch;
    logTlsBypassNotice();
  }
  return cachedFetch;
}
