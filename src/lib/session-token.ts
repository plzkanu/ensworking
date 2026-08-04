import type { SessionUser } from "./types";

export const SESSION_COOKIE = "ens_session";

/** maxAge가 있던 이전 쿠키 — 배포 후 자동 무효화 */
export const LEGACY_SESSION_COOKIES = ["ens_overtime_session"] as const;

/** 브라우저를 닫으면 만료되는 세션 쿠키 (maxAge/expires 미설정) */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function expireLegacySessionCookies(response: {
  cookies: {
    set: (
      name: string,
      value: string,
      options: { path: string; maxAge: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" },
    ) => void;
  };
}) {
  const expired = {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };
  for (const name of LEGACY_SESSION_COOKIES) {
    response.cookies.set(name, "", expired);
  }
}

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? "dev-secret-change-in-production";
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function getHmacKey() {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function signPayload(payload: string) {
  const encoder = new TextEncoder();
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return bufferToHex(signature);
}

async function verifySignature(payload: string, signature: string) {
  const encoder = new TextEncoder();
  const key = await getHmacKey();
  return crypto.subtle.verify(
    "HMAC",
    key,
    hexToBuffer(signature),
    encoder.encode(payload),
  );
}

export async function createSessionToken(user: SessionUser) {
  const payload = encodeBase64Url(JSON.stringify(user));
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function parseSessionToken(
  token: string,
): Promise<SessionUser | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const valid = await verifySignature(payload, signature);
  if (!valid) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as SessionUser;
    return {
      ...parsed,
      employeeNumber: parsed.employeeNumber ?? "",
      position: parsed.position ?? "",
      department: parsed.department ?? "",
    };
  } catch {
    return null;
  }
}
