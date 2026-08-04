import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  parseSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "./session-token";
import type { SessionUser } from "./types";

export { sessionCookieOptions };

export async function attachSessionCookie(
  response: NextResponse,
  user: SessionUser,
) {
  const token = await createSessionToken(user);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}

export async function clearSessionCookie(response?: NextResponse) {
  const expired = { ...sessionCookieOptions, maxAge: 0 };
  if (response) {
    response.cookies.set(SESSION_COOKIE, "", expired);
    return response;
  }
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", expired);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return parseSessionToken(token);
}

export function requireAdmin(
  session: SessionUser | null,
): session is SessionUser {
  return session?.role === "admin";
}
