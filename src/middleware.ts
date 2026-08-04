import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionCookieOptions } from "@/lib/session-token";
import { parseSessionToken, SESSION_COOKIE } from "@/lib/session-token";

function getOvertimeTypeFromPath(pathname: string): "regular" | "flexible" | null {
  if (pathname.startsWith("/overtime/regular")) {
    return "regular";
  }
  if (pathname.startsWith("/overtime/flexible")) {
    return "flexible";
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/overtime/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await parseSessionToken(token);
  if (!user) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
    return response;
  }

  const overtimeType = getOvertimeTypeFromPath(pathname);
  if (overtimeType && user.role !== "admin") {
    try {
      const checkUrl = new URL("/api/overtime/access", request.url);
      checkUrl.searchParams.set("type", overtimeType);
      const check = await fetch(checkUrl, {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        cache: "no-store",
      });
      if (check.ok) {
        const data = (await check.json()) as { open?: boolean; message?: string };
        if (!data.open) {
          const redirectUrl = new URL("/dashboard", request.url);
          redirectUrl.searchParams.set("overtime_closed", overtimeType);
          if (data.message) {
            redirectUrl.searchParams.set("message", data.message);
          }
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch {
      // access check failure — allow auth-only fallback
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/overtime/:path*"],
};
