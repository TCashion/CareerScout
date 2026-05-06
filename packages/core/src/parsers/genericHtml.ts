import { load } from "cheerio";

import { normalizeUrl } from "../normalize.js";
import type { JobParser, JobPosting, ParserContext } from "../types.js";

export class GenericHtmlParser implements JobParser {
  readonly type = "genericHtml" as const;

  async parse(context: ParserContext): Promise<JobPosting[]> {
    const $ = load(context.html);
    const jobs: JobPosting[] = [];

    $("a").each((_, element) => {
      const title = $(element).text().trim();
      const href = $(element).attr("href");
      const nearbyText = $(element).parent().text();
      const locationMatch = nearbyText.match(
        /(remote|hybrid|denver|boulder|colorado|co)\b/i
      );

      if (!title || !href) {
        return;
      }

      if (!/engineer|developer|sre|platform|infrastructure/i.test(title)) {
        return;
      }

      const url = normalizeUrl(new URL(href, context.sourceUrl).toString());

      jobs.push({
        companyId: context.company.id,
        companyName: context.company.name,
        title,
        location: locationMatch?.[0] ?? "Unknown",
        url,
        canonicalUrl: url,
        parser: this.type
      });
    });

    return jobs;
  }
}
