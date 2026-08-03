export function getRequestMeta(request: Request) {
  return getRequestMetaFromHeaders(request.headers);
}

export function getRequestMetaFromHeaders(headerStore: Headers) {
  const forwarded = headerStore.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    "";
  const userAgent = headerStore.get("user-agent") ?? "";
  return { ip, userAgent };
}
