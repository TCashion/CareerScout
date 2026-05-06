import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { companyConfigFileSchema } from "../configSchema.js";
import { filterJobPostings } from "../filters.js";
import { GreenhouseParser } from "../parsers/greenhouse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadOnxCompanyConfig() {
  const rawConfig = await readFile(
    resolve(__dirname, "../../../../configs/companies.yaml"),
    "utf8"
  );
  const parsedConfig = companyConfigFileSchema.parse(parse(rawConfig));
  const onxCompany = parsedConfig.companies.find((company) => company.id === "onx");

  if (!onxCompany) {
    throw new Error("Expected onx company configuration in configs/companies.yaml");
  }

  return onxCompany;
}

describe("GreenhouseParser", () => {
  it("returns the expected current onX engineering titles from a deterministic fixture", async () => {
    const [html, onxCompany] = await Promise.all([
      readFile(resolve(__dirname, "fixtures/onx-greenhouse.html"), "utf8"),
      loadOnxCompanyConfig()
    ]);
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
    const [html, onxCompany] = await Promise.all([
      readFile(resolve(__dirname, "fixtures/onx-greenhouse.html"), "utf8"),
      loadOnxCompanyConfig()
    ]);
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
