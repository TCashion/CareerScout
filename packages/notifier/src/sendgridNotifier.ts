import sendgridMail from "@sendgrid/mail";

export type DigestNotificationJob = {
  companyName: string;
  title: string;
  location: string;
  url: string;
  firstSeenAt: string;
  matchReasons: string[];
};

export interface Notifier {
  sendDigest(jobs: DigestNotificationJob[]): Promise<void>;
}

export class DryRunNotifier implements Notifier {
  async sendDigest(jobs: DigestNotificationJob[]): Promise<void> {
    console.log(
      JSON.stringify({
        level: "info",
        event: "dry_run_digest",
        jobs
      })
    );
  }
}

type SendGridNotifierOptions = {
  apiKey?: string;
  fromEmail?: string;
  recipientEmail?: string;
};

export class SendGridNotifier implements Notifier {
  private readonly fromEmail?: string;
  private readonly recipientEmail?: string;

  constructor(options: SendGridNotifierOptions) {
    this.fromEmail = options.fromEmail;
    this.recipientEmail = options.recipientEmail;

    if (options.apiKey) {
      sendgridMail.setApiKey(options.apiKey);
    }
  }

  async sendDigest(jobs: DigestNotificationJob[]): Promise<void> {
    if (!this.fromEmail || !this.recipientEmail) {
      throw new Error(
        "SENDGRID_FROM_EMAIL and CAREERSCOUT_DIGEST_RECIPIENT are required for live notifications."
      );
    }

    const lines = jobs.map(
      (job) =>
        `- ${job.companyName}: ${job.title} (${job.location})\n  ${job.url}\n  ${job.matchReasons.join("; ")}\n  First seen: ${job.firstSeenAt}`
    );

    await sendgridMail.send({
      to: this.recipientEmail,
      from: this.fromEmail,
      subject: `CareerScout found ${jobs.length} new matching job${jobs.length === 1 ? "" : "s"}`,
      text: ["New matching jobs:", ...lines].join("\n\n")
    });
  }
}
