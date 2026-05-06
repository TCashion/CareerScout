import type { CompanyConfig } from "./configSchema.js";
import { normalizeLocation, normalizeText } from "./normalize.js";
import type { FilterResult, JobPosting } from "./types.js";

function includesAny(haystack: string, needles: string[]): string[] {
  return needles.filter((needle) => haystack.includes(normalizeText(needle)));
}

function matchesLocation(location: string, allowedLocations: string[]): string[] {
  const normalizedLocation = normalizeLocation(location);
  const matchedLocations = allowedLocations.filter((allowedLocation) =>
    normalizedLocation.includes(normalizeLocation(allowedLocation))
  );

  return matchedLocations;
}

export function evaluateJobPosting(job: JobPosting, company: CompanyConfig): FilterResult | null {
  const normalizedTitle = normalizeText(job.title);
  const locationMatches = company.skipLocationFilter
    ? ["location filter skipped"]
    : matchesLocation(job.location, company.allowedLocations);
  const includeMatches = includesAny(normalizedTitle, company.includeKeywords);
  const excludeMatches = includesAny(normalizedTitle, company.excludeTerms);

  if (includeMatches.length === 0) {
    return null;
  }

  if (excludeMatches.length > 0) {
    return null;
  }

  if (locationMatches.length === 0) {
    return null;
  }

  return {
    job,
    reasons: [
      `matched title keyword(s): ${includeMatches.join(", ")}`,
      company.skipLocationFilter
        ? "matched location(s): skipped by company configuration"
        : `matched location(s): ${locationMatches.join(", ")}`
    ]
  };
}

export function filterJobPostings(jobs: JobPosting[], company: CompanyConfig): FilterResult[] {
  return jobs
    .map((job) => evaluateJobPosting(job, company))
    .filter((result): result is FilterResult => result !== null);
}
