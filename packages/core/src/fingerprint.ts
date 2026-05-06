import { createHash } from "node:crypto";

import { normalizeLocation, normalizeText, normalizeUrl } from "./normalize.js";
import type { JobPosting } from "./types.js";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function buildJobFingerprint(job: JobPosting): string {
  const stableKey = job.sourceJobId
    ? `${job.companyId}::sourceJobId::${normalizeText(job.sourceJobId)}`
    : job.canonicalUrl
      ? `${job.companyId}::canonicalUrl::${normalizeUrl(job.canonicalUrl)}`
      : `${job.companyId}::titleLocation::${normalizeText(job.title)}::${normalizeLocation(job.location)}`;

  return sha256(stableKey);
}
