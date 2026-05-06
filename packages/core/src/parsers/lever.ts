import { load } from "cheerio";

import { normalizeUrl } from "../normalize.js";
import type { JobParser, JobPosting, ParserContext } from "../types.js";

export class LeverParser implements JobParser {
  readonly type = "lever" as const;

  async parse(context: ParserContext): Promise<JobPosting[]> {
    const $ = load(context.html);
    const jobs: JobPosting[] = [];

    $(".posting, .posting-container").each((_, element) => {
      const title = $(element).find(".posting-title h5, .posting-title, a").first().text().trim();
      const href = $(element).find("a").first().attr("href");
      const location = $(element).find(".posting-categories .location, .sort-by-location").first().text().trim();
      const team = $(element).find(".posting-categories .department, .sort-by-team").first().text().trim();

      if (!title || !href) {
        return;
      }

      const url = normalizeUrl(new URL(href, context.sourceUrl).toString());

      jobs.push({
        companyId: context.company.id,
        companyName: context.company.name,
        title,
        location: location || "Unknown",
        url,
        canonicalUrl: url,
        team: team || undefined,
        parser: this.type
      });
    });

    return jobs;
  }
}
