const TRACKING_QUERY_PARAMS = new Set([
  "gh_jid",
  "gh_src",
  "lever-origin",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term"
]);

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/[^\w\s/-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function normalizeLocation(value: string): string {
  return normalizeText(value).replace(/\bco\b/g, "colorado").trim();
}

export function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";

    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    const search = url.searchParams.toString();
    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";

    return `${url.origin.toLowerCase()}${normalizedPath}${search ? `?${search}` : ""}`;
  } catch {
    return value.trim();
  }
}
