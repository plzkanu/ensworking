import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser } from "@/lib/auth";
import { logUserAccess } from "@/lib/access-log-store";
import { logUserActivity } from "@/lib/activity-log-store";
import { getRequestMeta } from "@/lib/request-meta";

export async function POST(request: Request) {
  const session = await getSessionUser();
  const { ip, userAgent } = getRequestMeta(request);

  if (session) {
    await logUserAccess({
      userId: session.id,
      eventType: "logout",
      ipAddress: ip,
      userAgent,
    });
    await logUserActivity({
      userId: session.id,
      action: "logout",
      resource: "/logout",
      ipAddress: ip,
    });
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
