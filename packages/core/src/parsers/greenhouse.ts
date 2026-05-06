import { load } from "cheerio";

import { normalizeUrl } from "../normalize.js";
import type { JobParser, JobPosting, ParserContext } from "../types.js";

export class GreenhouseParser implements JobParser {
  readonly type = "greenhouse" as const;

  async parse(context: ParserContext): Promise<JobPosting[]> {
    const $ = load(context.html);
    const jobs: JobPosting[] = [];

    $(".opening, .job-post, [data-mapped='true']").each((_, element) => {
      const title = $(element).find("a, .opening-name").first().text().trim();
      const href = $(element).find("a").first().attr("href");
      const location = $(element).find(".location, [class*='location']").first().text().trim();

      if (!title || !href) {
        return;
      }

      const url = normalizeUrl(new URL(href, context.sourceUrl).toString());
      const sourceJobId = $(element).attr("data-job-id") ?? undefined;

      jobs.push({
        companyId: context.company.id,
        companyName: context.company.name,
        title,
        location: location || "Unknown",
        url,
        canonicalUrl: url,
        sourceJobId,
        parser: this.type
      });
    });

    return jobs;
  }
}
