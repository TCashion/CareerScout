import { describe, expect, it } from "vitest";

import { buildJobFingerprint } from "../fingerprint.js";
import type { JobPosting } from "../types.js";

function makeJob(overrides: Partial<JobPosting>): JobPosting {
  return {
    companyId: "example",
    companyName: "Example",
    title: "Senior Software Engineer",
    location: "Denver, CO",
    url: "https://example.com/jobs/123",
    canonicalUrl: "https://example.com/jobs/123?utm_source=test",
    parser: "genericHtml",
    ...overrides
  };
}

describe("buildJobFingerprint", () => {
  it("prefers companyId and sourceJobId when present", () => {
    const first = buildJobFingerprint(makeJob({ sourceJobId: " ABC-123 " }));
    const second = buildJobFingerprint(makeJob({ sourceJobId: "abc-123" }));

    expect(first).toBe(second);
  });

  it("falls back to canonicalUrl with URL normalization", () => {
    const first = buildJobFingerprint(
      makeJob({ sourceJobId: undefined, canonicalUrl: "https://example.com/jobs/123?utm_source=a" })
    );
    const second = buildJobFingerprint(
      makeJob({ sourceJobId: undefined, canonicalUrl: "https://example.com/jobs/123" })
    );

    expect(first).toBe(second);
  });

  it("falls back to normalized title and location", () => {
    const first = buildJobFingerprint(
      makeJob({
        sourceJobId: undefined,
        canonicalUrl: undefined,
        title: " Senior   Software Engineer ",
        location: "Denver, CO"
      })
    );
    const second = buildJobFingerprint(
      makeJob({
        sourceJobId: undefined,
        canonicalUrl: undefined,
        title: "senior software engineer",
        location: "denver colorado"
      })
    );

    expect(first).toBe(second);
  });

  it("changes when identity meaningfully changes", () => {
    const first = buildJobFingerprint(makeJob({ sourceJobId: "123" }));
    const second = buildJobFingerprint(makeJob({ sourceJobId: "456" }));

    expect(first).not.toBe(second);
  });
});
