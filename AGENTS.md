# AGENTS.md — CareerScout

## Project Overview

CareerScout is a portfolio-worthy, cost-conscious job monitoring app.

It scans specific target company career sites for relevant software engineering jobs, filters for mid-level and senior-level roles, deduplicates already-seen postings, and sends a digest email when new matching roles are found.

This project should be useful in a real job search and strong enough to showcase publicly on GitHub.

## Product Goals

CareerScout should:

- Monitor specific company career pages.
- Avoid generic job boards.
- Detect new job postings without duplicate notifications.
- Filter for relevant software engineering roles.
- Prefer mid-level and senior-level roles.
- Target remote roles or hybrid roles in the Denver/Boulder/Colorado area.
- Send a digest email only when new matching jobs are found.
- Stay simple, low-cost, and maintainable.
- Be safe to publish publicly.

## Non-Goals for MVP

Do not implement these unless explicitly requested:

- Generic job board scraping.
- Browser automation with Playwright.
- OpenAI/AI parsing.
- Complex queues or Pub/Sub.
- Redis.
- Cloud SQL.
- A frontend UI.
- User authentication.
- Multi-user support.
- Full Terraform deployment.
- Real production secrets.

## Target Stack

Use:

- TypeScript
- Node.js 20
- npm workspaces
- Vitest
- zod
- yaml
- cheerio
- Native fetch
- Firestore for deployed persistence
- SendGrid for email notifications
- Google Secret Manager for deployed secrets
- Cloud Run Job for execution
- Cloud Scheduler for scheduling
- Cloud Logging via structured JSON logs

Avoid adding extra dependencies unless they clearly simplify the MVP.

## Monorepo Structure

Expected structure:

```text
/
  README.md
  AGENTS.md
  package.json
  tsconfig.base.json
  .gitignore
  .env.example
  configs/
    companies.example.yaml
  apps/
    scraper-job/
      package.json
      src/
        index.ts
        loadConfig.ts
        run.ts
  packages/
    core/
      package.json
      src/
        types.ts
        filters.ts
        fingerprint.ts
        normalize.ts
        configSchema.ts
        parsers/
          parser.ts
          greenhouse.ts
          lever.ts
          genericHtml.ts
        __tests__/
          filters.test.ts
          fingerprint.test.ts
  packages/
    firestore-store/
      package.json
      src/
        seenJobsStore.ts
  packages/
    notifier/
      package.json
      src/
        sendgridNotifier.ts
  infra/
    terraform/
      README.md
      main.tf.placeholder

Keep code organized by responsibility.

## Security Rules

These rules are strict.

Never commit:

- API keys
- SendGrid keys
- OpenAI keys
- GCP service account JSON files
- Tokens
- Passwords
- .env
- Raw credentials
- Generated secret values
- Personal email addresses unless explicitly provided as placeholder-safe examples

Use:

.env.example for local variable names only
Environment variables for local development
Google Secret Manager for deployed secrets

If a task requires a secret, create a placeholder variable name and document where the secret should be stored.

Example:

`SENDGRID_API_KEY_SECRET_NAME=careerscout-sendgrid-api-key`

Never invent fake real-looking secrets.

## Config Rules 

Company career sites must be configurable.

Use a YAML config file for MVP.

Config should support:

company ID
company name
careers URL
parser type
enabled flag
include keywords
exclude terms
allowed locations
optional source-specific metadata

Example shape:

```yaml
companies:
  - id: example
    name: Example Co
    careersUrl: "https://example.com/careers"
    parser: "genericHtml"
    enabled: true
    includeKeywords:
      - software engineer
      - backend engineer
      - full stack engineer
      - platform engineer
      - site reliability engineer
      - sre
    excludeTerms:
      - junior
      - associate
      - principal
      - staff
      - intern
      - new grad
      - manager
      - director
      - vp
    allowedLocations:
      - remote
      - denver
      - boulder
      - colorado
```

Do not hardcode company-specific behavior unless it is inside a parser adapter or config.

## Filtering Rules

The filter should favor practical usefulness over cleverness.

Include roles with software engineering signals such as:

- software engineer
- backend engineer
- full stack engineer
- full-stack engineer
- platform engineer
- site reliability engineer
- sre
- infrastructure engineer
- product engineer

Exclude roles with terms such as:

- junior
- associate
- entry level
- new grad
- intern
- staff
- principal
- distinguished
- manager
- director
- vp

These lists must be configurable and extensible.

Location filtering should prefer:

- remote
- Denver
- Boulder
- Colorado
- hybrid roles plausibly tied to Colorado

When in doubt, keep the filtering logic readable and testable.

## Fingerprinting Rules

Each job posting needs a stable fingerprint to prevent duplicate notifications.

Fingerprint priority:

```
companyId + sourceJobId
companyId + canonicalUrl
companyId + normalizedTitle + normalizedLocation
```

Hash the selected stable key with SHA-256.

Normalize values before hashing:

- lowercase
- trim whitespace
- collapse repeated whitespace
- normalize URLs
- remove irrelevant tracking query params
- normalize punctuation where appropriate

Do not use full job descriptions in the primary fingerprint because descriptions can change.

## Parser Rules

Use deterministic parsing first.

Parser architecture should use a common interface.

Expected parser types:

- greenhouse
- lever
- genericHtml

Each parser should return normalized or partially normalized job records.

Parser failures should not crash the entire run unless there is a systemic failure.

Log parser failures with company ID and parser name.

Do not add Playwright unless static fetching cannot work for a target company.

Do not add OpenAI parsing in MVP.

## Persistence Rules

For MVP, support local dry-run behavior without requiring GCP credentials.

Use an interface for seen-job persistence.

Expected implementations:

- In-memory store for tests and dry runs
- Firestore-backed store for deployed usage

Seen job records should support:

- fingerprint
- company ID
- title
- location
- URL
- firstSeenAt
- lastSeenAt
- notification status if needed later
- Notification Rules

Use a notifier interface.

For MVP:

- Dry-run notifier logs matching jobs.
- SendGrid notifier sends digest emails later.
- Do not send emails when no new matching jobs are found.
- Prefer one digest email over one email per job.

Digest email should eventually include:

- Company
- Job title
- Location
- URL
- Why it matched
- First seen timestamp
- Logging and Observability

Use structured JSON logs.

Prefer simple logs that work naturally with Google Cloud Logging.

Log:

- run started
- run finished
- number of companies checked
- number of pages fetched
- number of jobs parsed
- number of jobs matched
- number of new jobs found
- number of notifications sent
- parser failures
- fetch failures

Do not log full HTML pages.
Do not log secrets.
Do not log API keys.
Do not log any personal information.

## Error Handling

The scraper should be resilient.

Rules:

- One company failure should not stop all companies.
- Network failures should be logged.
- Parser failures should be logged.
- Invalid config should fail fast with a clear error.
- Notification failure should be logged clearly.
- Tests should cover core filtering and fingerprinting behavior.

## Cost Rules

Keep the system low-cost.

Prefer:

- Cloud Run Job over always-on servers
- Firestore over Redis
- Static HTTP fetch over browser automation
- Daily digest over many emails
- Structured summary logs over verbose raw logs

Avoid:

- Always-on Redis
- Cloud SQL
- Large log payloads
- Unbounded AI calls
- Unbounded scraping
- High-frequency schedules

## Coding Standards

Use clear, boring, maintainable TypeScript.

Prefer:

Small modules
Pure functions for filtering and fingerprinting
Explicit types
zod validation for external config
Unit tests for business logic
Readable names
Minimal dependency count

Avoid:

- Clever abstractions
- Premature optimization
- Large files
- Hidden side effects
- Hardcoded secrets
- Hardcoded personal data
- Commiting to the `main` branch. 

## Testing

Use Vitest.

Required early tests:

- Filtering includes relevant software engineering roles.
- Filtering excludes junior, associate, staff, principal, manager, etc.
- Location filtering allows remote and Colorado/Denver/Boulder roles.
- Fingerprinting is stable across whitespace/case changes.
- Fingerprinting changes when meaningful identity changes.
- Config validation catches invalid parser names or missing required fields.

Before considering a task complete, run:

- npm test
- npm run typecheck
- npm run lint

If those commands are not yet available, add them.

## README Expectations

Keep README useful and portfolio-friendly.

README should include:

- What CareerScout does
- Why it exists
- Architecture overview
- Monorepo structure
- Local setup
- Dry-run instructions
- Example config
- Security/secrets note
- Cost-conscious design choices
- Future roadmap
- Infrastructure Guidance

For now, do not fully implement Terraform unless explicitly asked.

Acceptable initial infrastructure folder:

infra/
  terraform/
    README.md
    main.tf.placeholder

Later Terraform should manage:

- Cloud Run Job
- Cloud Scheduler trigger
- Firestore database/indexes if practical
- Service account
- IAM bindings
- Secret access permissions
- Artifact Registry repository

GCP project creation, billing setup, and initial secret creation may be documented as manual steps.

## Git Hygiene

Keep commits logical.

Commits should only go to feature branches, never, ever to the `main` branch. New branch names should be prefixed with `tc/<>`, such as `tc/new-feature`. 

Commits should have a concise but thorough description of the changes to be included. 

Do not commit:

- node_modules
- .env
- coverage output unless intentionally configured otherwise
- build artifacts
- secret files
- service account JSON

Update .gitignore accordingly.

## Working Style for Codex

When making changes:

- Inspect existing files first.
- Make the smallest coherent change.
- Prefer implementation plus tests.
- Run tests/typecheck when possible.
- Summarize what changed.
- List any follow-up tasks.

When uncertain, make a reasonable MVP-oriented assumption and document it.
