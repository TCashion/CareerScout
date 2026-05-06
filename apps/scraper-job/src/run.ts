import { filterJobPostings } from "@careerscout/core/filters";
import { buildJobFingerprint } from "@careerscout/core/fingerprint";
import { getParserForType } from "@careerscout/core/parsers/parser";
import type { JobPosting, Logger, ParserType } from "@careerscout/core/types";
import { InMemorySeenJobsStore } from "@careerscout/firestore-store/seenJobsStore";
import {
  DryRunNotifier,
  SendGridNotifier,
  type DigestNotificationJob,
  type Notifier
} from "@careerscout/notifier/sendgridNotifier";

import { loadConfig } from "./loadConfig.js";

type RunOptions = {
  configPath: string;
  dryRun: boolean;
  logParsedJobs?: boolean;
  logMatchedJobs?: boolean;
  logger?: Logger;
};

function resolveCompanySourceUrl(company: Awaited<ReturnType<typeof loadConfig>>["companies"][number]): string {
  if (
    company.parser === "greenhouse" &&
    typeof company.sourceMetadata?.greenhouseBoardToken === "string"
  ) {
    return `https://job-boards.greenhouse.io/${company.sourceMetadata.greenhouseBoardToken}`;
  }

  return company.careersUrl;
}

function serializeJob(job: JobPosting): Record<string, string | undefined> {
  return {
    companyId: job.companyId,
    companyName: job.companyName,
    title: job.title,
    location: job.location,
    url: job.url,
    canonicalUrl: job.canonicalUrl ?? job.url,
    sourceJobId: job.sourceJobId,
    fingerprint: buildJobFingerprint(job)
  };
}

function createJsonLogger(): Logger {
  return {
    info(event, details = {}) {
      console.log(JSON.stringify({ level: "info", event, ...details }));
    },
    error(event, details = {}) {
      console.error(JSON.stringify({ level: "error", event, ...details }));
    }
  };
}

function createNotifier(dryRun: boolean): Notifier {
  if (dryRun) {
    return new DryRunNotifier();
  }

  return new SendGridNotifier({
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    recipientEmail: process.env.CAREERSCOUT_DIGEST_RECIPIENT
  });
}

export async function runCareerScout(options: RunOptions): Promise<void> {
  const logger = options.logger ?? createJsonLogger();
  const config = await loadConfig(options.configPath);
  const enabledCompanies = config.companies.filter((company) => company.enabled);
  const seenJobsStore = new InMemorySeenJobsStore();
  const notifier = createNotifier(options.dryRun);

  let pagesFetched = 0;
  let jobsParsed = 0;
  let jobsMatched = 0;
  let newJobsFound = 0;
  let parserFailures = 0;
  let fetchFailures = 0;
  const digestJobs: DigestNotificationJob[] = [];

  logger.info("run_started", {
    dryRun: options.dryRun,
    companiesChecked: enabledCompanies.length
  });

  for (const company of enabledCompanies) {
    try {
      const sourceUrl = resolveCompanySourceUrl(company);
      const response = await fetch(sourceUrl);

      if (!response.ok) {
        fetchFailures += 1;
        logger.error("fetch_failed", {
          companyId: company.id,
          parser: company.parser,
          status: response.status,
          careersUrl: company.careersUrl,
          sourceUrl
        });
        continue;
      }

      const html = await response.text();
      pagesFetched += 1;

      const parser = getParserForType(company.parser as ParserType);

      let parsedJobs: JobPosting[] = [];

      try {
        parsedJobs = await parser.parse({
          company,
          html,
          sourceUrl
        });
      } catch (error) {
        parserFailures += 1;
        logger.error("parser_failed", {
          companyId: company.id,
          parser: company.parser,
          message: error instanceof Error ? error.message : "Unknown parser error"
        });
        continue;
      }

      jobsParsed += parsedJobs.length;

      const filteredJobs = filterJobPostings(parsedJobs, company);
      jobsMatched += filteredJobs.length;

      logger.info("company_processed", {
        companyId: company.id,
        parser: company.parser,
        careersUrl: company.careersUrl,
        sourceUrl,
        parsedJobsCount: parsedJobs.length,
        matchedJobsCount: filteredJobs.length
      });

      if (options.logParsedJobs) {
        logger.info("parsed_jobs", {
          companyId: company.id,
          parsedJobsCount: parsedJobs.length,
          parsedJobs: parsedJobs.map(serializeJob)
        });
      }

      if (options.logMatchedJobs) {
        logger.info("matched_jobs", {
          companyId: company.id,
          matchedJobsCount: filteredJobs.length,
          matchedJobs: filteredJobs.map((result) => ({
            ...serializeJob(result.job),
            matchReasons: result.reasons
          }))
        });
      }

      for (const result of filteredJobs) {
        const fingerprint = buildJobFingerprint(result.job);
        const hasSeen = await seenJobsStore.hasSeen(fingerprint);

        if (hasSeen) {
          continue;
        }

        await seenJobsStore.markSeen({
          fingerprint,
          companyId: result.job.companyId,
          title: result.job.title,
          location: result.job.location,
          url: result.job.url,
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString()
        });

        newJobsFound += 1;

        digestJobs.push({
          companyName: company.name,
          title: result.job.title,
          location: result.job.location,
          url: result.job.url,
          firstSeenAt: new Date().toISOString(),
          matchReasons: result.reasons
        });
      }
    } catch (error) {
      fetchFailures += 1;
      logger.error("company_run_failed", {
        companyId: company.id,
        parser: company.parser,
        careersUrl: company.careersUrl,
        message: error instanceof Error ? error.message : "Unknown company failure"
      });
    }
  }

  let notificationsSent = 0;

  if (digestJobs.length > 0) {
    await notifier.sendDigest(digestJobs);
    notificationsSent = 1;
  }

  logger.info("run_finished", {
    companiesChecked: enabledCompanies.length,
    pagesFetched,
    jobsParsed,
    jobsMatched,
    newJobsFound,
    notificationsSent,
    parserFailures,
    fetchFailures
  });
}
