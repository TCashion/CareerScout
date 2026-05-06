import type { CompanyConfig } from "./configSchema.js";
import type { GenericHtmlParser } from "./parsers/genericHtml.js";
import type { GreenhouseParser } from "./parsers/greenhouse.js";
import type { LeverParser } from "./parsers/lever.js";

export type ParserType = "greenhouse" | "lever" | "genericHtml";

export type JobPosting = {
  companyId: string;
  companyName: string;
  title: string;
  location: string;
  url: string;
  sourceJobId?: string;
  canonicalUrl?: string;
  employmentType?: string;
  team?: string;
  parser: ParserType;
};

export type SeenJobRecord = {
  fingerprint: string;
  companyId: string;
  title: string;
  location: string;
  url: string;
  firstSeenAt: string;
  lastSeenAt: string;
  notificationStatus?: "pending" | "sent";
};

export type FilterResult = {
  job: JobPosting;
  reasons: string[];
};

export type ParserContext = {
  company: CompanyConfig;
  html: string;
  sourceUrl: string;
};

export interface JobParser {
  readonly type: ParserType;
  parse(context: ParserContext): Promise<JobPosting[]>;
}

export interface SeenJobsStore {
  hasSeen(fingerprint: string): Promise<boolean>;
  markSeen(record: SeenJobRecord): Promise<void>;
}

export interface Logger {
  info(event: string, details?: Record<string, unknown>): void;
  error(event: string, details?: Record<string, unknown>): void;
}

export type ParserRegistry = {
  greenhouse: GreenhouseParser;
  lever: LeverParser;
  genericHtml: GenericHtmlParser;
};
