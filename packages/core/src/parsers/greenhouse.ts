import { load } from "cheerio";

import { normalizeUrl } from "../normalize.js";
import type { JobParser, JobPosting, ParserContext } from "../types.js";

type GreenhouseRemixJobPost = {
  id?: number | string;
  title?: string;
  location?: string;
  absolute_url?: string;
  department?: {
    name?: string;
    path?: string[];
  };
};

type GreenhouseRemixContext = {
  state?: {
    loaderData?: {
      "routes/$url_token"?: {
        jobPosts?: {
          data?: GreenhouseRemixJobPost[];
        };
      };
    };
  };
};

function extractRemixContext(html: string): GreenhouseRemixContext | null {
  const marker = "window.__remixContext = ";
  const startIndex = html.indexOf(marker);

  if (startIndex === -1) {
    return null;
  }

  const jsonStart = startIndex + marker.length;
  const scriptCloseIndex = html.indexOf("</script>", jsonStart);

  if (scriptCloseIndex === -1) {
    return null;
  }

  try {
    const serializedContext = html
      .slice(jsonStart, scriptCloseIndex)
      .trim()
      .replace(/;$/, "");

    return JSON.parse(serializedContext) as GreenhouseRemixContext;
  } catch {
    return null;
  }
}

function extractSourceJobId(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\/jobs\/(\d+)/);

    return match?.[1];
  } catch {
    return undefined;
  }
}

function buildTeamName(department?: GreenhouseRemixJobPost["department"]): string | undefined {
  if (!department?.name) {
    return undefined;
  }

  const departmentPath = department.path?.filter(Boolean) ?? [];

  return [...departmentPath, department.name].join(" > ");
}

export class GreenhouseParser implements JobParser {
  readonly type = "greenhouse" as const;

  async parse(context: ParserContext): Promise<JobPosting[]> {
    const remixContext = extractRemixContext(context.html);
    const remixJobs =
      remixContext?.state?.loaderData?.["routes/$url_token"]?.jobPosts?.data ?? [];

    if (remixJobs.length > 0) {
      return remixJobs.flatMap((job) => {
        if (!job.title || !job.absolute_url) {
          return [];
        }

        const url = normalizeUrl(job.absolute_url);

        return [
          {
            companyId: context.company.id,
            companyName: context.company.name,
            title: job.title.trim(),
            location: job.location?.trim() || "Unknown",
            url,
            canonicalUrl: url,
            sourceJobId: job.id ? String(job.id).trim() : extractSourceJobId(url),
            team: buildTeamName(job.department),
            parser: this.type
          }
        ];
      });
    }

    const $ = load(context.html);
    const jobs: JobPosting[] = [];

    $(".opening, .job-post, [data-mapped='true']").each((_, element) => {
      const link = $(element).find("a").first();
      const href = link.attr("href");
      const titleNode = link.find(".body--medium, .opening-name").first().clone();

      titleNode.find(".tag-container").remove();

      const title = (titleNode.text() || link.text()).trim();
      const location = link
        .find(".location, [class*='location'], .body--metadata")
        .first()
        .text()
        .trim();

      if (!title || !href) {
        return;
      }

      const url = normalizeUrl(new URL(href, context.sourceUrl).toString());
      const sourceJobId = $(element).attr("data-job-id") ?? extractSourceJobId(url);

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
