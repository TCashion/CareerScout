import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { companyConfigSchema } from "../configSchema.js";
import { filterJobPostings } from "../filters.js";
import { GreenhouseParser } from "../parsers/greenhouse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const onxCompany = companyConfigSchema.parse({
  id: "onx",
  name: "onX",
  careersUrl: "https://www.onxmaps.com/join-our-team",
  parser: "greenhouse",
  enabled: true,
  skipLocationFilter: true,
  sourceMetadata: {
    greenhouseBoardToken: "onxmaps"
  },
  includeKeywords: [
    "software engineer",
    "backend engineer",
    "platform engineer",
    "site reliability engineer",
    "sre",
    "engineering"
  ],
  excludeTerms: [
    "junior",
    "associate",
    "entry level",
    "new grad",
    "intern",
    "staff",
    "principal",
    "distinguished",
    "manager",
    "director",
    "vp"
  ],
  allowedLocations: ["remote", "denver", "boulder", "colorado"]
});

describe("GreenhouseParser", () => {
  it("returns the expected current onX engineering titles from a deterministic fixture", async () => {
    const html = await readFile(
      resolve(__dirname, "fixtures/onx-greenhouse.html"),
      "utf8"
    );
    const parser = new GreenhouseParser();

    const jobs = await parser.parse({
      company: onxCompany,
      html,
      sourceUrl: "https://job-boards.greenhouse.io/onxmaps"
    });

    expect(jobs.map((job) => job.title)).toEqual([
      "General Consideration - Engineering",
      "Senior Backend Engineer - Identity & Access Management",
      "Senior Software Engineer - Map Viewer",
      "Staff Software Engineer - AI"
    ]);
    expect(jobs.map((job) => job.sourceJobId)).toEqual([
      "4230452006",
      "4677122006",
      "4672167006",
      "4675041006"
    ]);
    expect(jobs.every((job) => job.canonicalUrl?.startsWith("https://job-boards.greenhouse.io/onxmaps/jobs/"))).toBe(
      true
    );
  });

  it("keeps staff titles in parsed jobs but excludes them from matched jobs", async () => {
    const html = await readFile(
      resolve(__dirname, "fixtures/onx-greenhouse.html"),
      "utf8"
    );
    const parser = new GreenhouseParser();

    const jobs = await parser.parse({
      company: onxCompany,
      html,
      sourceUrl: "https://job-boards.greenhouse.io/onxmaps"
    });

    const matchedJobs = filterJobPostings(jobs, onxCompany);

    expect(matchedJobs.map((result) => result.job.title)).toEqual([
      "General Consideration - Engineering",
      "Senior Backend Engineer - Identity & Access Management",
      "Senior Software Engineer - Map Viewer"
    ]);
    expect(matchedJobs.some((result) => result.job.title.includes("Staff"))).toBe(
      false
    );
  });
});
