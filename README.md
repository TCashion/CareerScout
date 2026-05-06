# CareerScout

CareerScout is a portfolio-worthy, low-cost job monitoring app for tracking software engineering roles on specific company career pages. It favors deterministic parsing, simple infrastructure, and safe defaults so it is useful for a real job search while still being publishable on GitHub.

## What It Does

- Fetches configured company career pages.
- Parses job listings with deterministic parser adapters.
- Filters for relevant mid-level and senior software engineering roles.
- Prefers remote and Colorado-area opportunities.
- Deduplicates previously seen jobs with stable fingerprints.
- Prints matching jobs in dry run mode and is structured for digest email notifications later.

## Architecture

CareerScout is an npm workspace monorepo with three main layers:

- `apps/scraper-job`: CLI entrypoint for a scraper run.
- `packages/core`: shared domain types, config validation, normalization, filtering, fingerprinting, and parser adapters.
- `packages/firestore-store`: seen-job persistence interface plus in-memory and Firestore-backed implementations.
- `packages/notifier`: dry-run and SendGrid notifier implementations.

The MVP uses static fetching and Cheerio-based parsing. It avoids Playwright, AI parsing, and complex infrastructure.

## Monorepo Structure

```text
/
  configs/
  apps/
    scraper-job/
  packages/
    core/
    firestore-store/
    notifier/
  infra/
    terraform/
```

## Local Setup

1. Use Node.js 20 or newer.
2. Run `npm install`.
3. Copy values from `.env.example` into your local environment as needed. Do not commit `.env`.
4. Update `configs/companies.yaml` as needed for the companies you want to monitor.

## Dry Run

Dry run mode does not require Firestore or SendGrid credentials.

```bash
CAREERSCOUT_CONFIG_PATH=./configs/companies.yaml \
DRY_RUN=true \
npm start | jq -R 'fromjson?'
```

Dry run output logs structured JSON summaries and prints matching jobs instead of sending an email.

To inspect raw parsed jobs separately from matched jobs during a local run, enable one or both debug flags:

```bash
CAREERSCOUT_CONFIG_PATH=./configs/companies.yaml \
DRY_RUN=true \
LOG_PARSED_JOBS=true \
LOG_MATCHED_JOBS=true \
npm start | jq -R 'fromjson?'
```

`parsed_jobs` contains every job discovered by the parser. `matched_jobs` contains only jobs that passed the title and location filters.

## Config Example

```yaml
companies:
  - id: example
    name: Example Co
    careersUrl: "https://example.com/careers"
    parser: "genericHtml"
    enabled: true
    skipLocationFilter: false
    includeKeywords:
      - software engineer
      - backend engineer
      - platform engineer
    excludeTerms:
      - junior
      - associate
      - principal
      - staff
      - manager
    allowedLocations:
      - remote
      - denver
      - boulder
      - colorado
```

## Secrets And Safety

- Never commit API keys, tokens, `.env`, service account JSON files, or generated secret values.
- Local development should use environment variables only.
- Deployed environments should read secrets from Google Secret Manager.
- Placeholder environment variable names are documented in `.env.example`.

## Cost-Conscious Design

- Cloud Run Job for execution instead of an always-on service.
- Cloud Scheduler for low-frequency scheduling.
- Firestore for simple persistence.
- Static HTTP fetching and deterministic parsing instead of browser automation.
- Digest notifications instead of one email per posting.

## Future Deployment Plan

The `infra/terraform` directory currently contains placeholders only. A later task can add infrastructure for:

- Cloud Run Job
- Cloud Scheduler trigger
- Firestore resources
- Secret access and IAM wiring
- Artifact Registry support

## Development Commands

- `npm test`
- `npm run typecheck`
- `npm run lint`
