import { headers } from "next/headers";
import { getRequestMetaFromHeaders } from "@/lib/request-meta";

export async function getServerRequestMeta() {
  const headerStore = await headers();
  return getRequestMetaFromHeaders(headerStore);
}
