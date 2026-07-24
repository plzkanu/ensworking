import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    supabaseConfigured: isSupabaseConfigured(),
    authSecretConfigured: Boolean(process.env.AUTH_SECRET),
  });
}
