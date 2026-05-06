import { resolve } from "node:path";

import { runCareerScout } from "./run.js";

async function main(): Promise<void> {
  const configPath = process.env.CAREERSCOUT_CONFIG_PATH;

  if (!configPath) {
    throw new Error("CAREERSCOUT_CONFIG_PATH is required.");
  }

  await runCareerScout({
    configPath: resolve(configPath),
    dryRun: process.env.DRY_RUN === "true",
    logParsedJobs: process.env.LOG_PARSED_JOBS === "true",
    logMatchedJobs: process.env.LOG_MATCHED_JOBS === "true"
  });
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      level: "error",
      event: "fatal_error",
      message: error instanceof Error ? error.message : "Unknown fatal error"
    })
  );
  process.exitCode = 1;
});
