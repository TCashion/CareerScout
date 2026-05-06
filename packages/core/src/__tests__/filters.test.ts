import { describe, expect, it } from "vitest";

import { companyConfigSchema } from "../configSchema.js";
import { evaluateJobPosting } from "../filters.js";
import type { JobPosting } from "../types.js";

const company = companyConfigSchema.parse({
  id: "example",
  name: "Example",
  careersUrl: "https://example.com/careers",
  parser: "genericHtml",
  enabled: true,
  includeKeywords: [
    "software engineer",
    "backend engineer",
    "full stack engineer",
    "site reliability engineer",
    "sre"
  ],
  excludeTerms: ["junior", "associate", "staff", "principal", "manager", "intern"],
  allowedLocations: ["remote", "denver", "boulder", "colorado"]
});

function makeJob(overrides: Partial<JobPosting>): JobPosting {
  return {
    companyId: "example",
    companyName: "Example",
    title: "Software Engineer",
    location: "Remote - US",
    url: "https://example.com/jobs/1",
    canonicalUrl: "https://example.com/jobs/1",
    parser: "genericHtml",
    ...overrides
  };
}

describe("evaluateJobPosting", () => {
  it("includes relevant software engineering roles", () => {
    const result = evaluateJobPosting(
      makeJob({ title: "Senior Backend Engineer", location: "Denver, CO" }),
      company
    );

    expect(result).not.toBeNull();
    expect(result?.reasons[0]).toContain("backend engineer");
  });

  it("excludes junior and management titles", () => {
    expect(
      evaluateJobPosting(makeJob({ title: "Junior Software Engineer" }), company)
    ).toBeNull();
    expect(
      evaluateJobPosting(makeJob({ title: "Engineering Manager" }), company)
    ).toBeNull();
  });

  it("allows remote and Colorado-area roles", () => {
    expect(
      evaluateJobPosting(makeJob({ location: "Remote" }), company)
    ).not.toBeNull();
    expect(
      evaluateJobPosting(makeJob({ location: "Boulder, Colorado" }), company)
    ).not.toBeNull();
  });

  it("excludes non-target locations", () => {
    expect(
      evaluateJobPosting(makeJob({ location: "New York, NY" }), company)
    ).toBeNull();
  });

  it("skips location filtering when configured", () => {
    const companyWithSkippedLocationFilter = companyConfigSchema.parse({
      ...company,
      skipLocationFilter: true
    });

    const result = evaluateJobPosting(
      makeJob({ title: "Senior Backend Engineer", location: "Bozeman, MT" }),
      companyWithSkippedLocationFilter
    );

    expect(result).not.toBeNull();
    expect(result?.reasons[1]).toContain("skipped by company configuration");
  });

  it("still excludes staff titles when location filtering is skipped", () => {
    const companyWithSkippedLocationFilter = companyConfigSchema.parse({
      ...company,
      skipLocationFilter: true
    });

    expect(
      evaluateJobPosting(
        makeJob({ title: "Staff Software Engineer - AI", location: "Bozeman, MT" }),
        companyWithSkippedLocationFilter
      )
    ).toBeNull();
  });
});
