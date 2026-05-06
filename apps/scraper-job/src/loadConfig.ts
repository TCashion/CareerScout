import { readFile } from "node:fs/promises";
import { parse } from "yaml";

import {
  companyConfigFileSchema,
  type CompanyConfigFile
} from "@careerscout/core/configSchema";

export async function loadConfig(configPath: string): Promise<CompanyConfigFile> {
  const rawConfig = await readFile(configPath, "utf8");
  const parsed = parse(rawConfig);

  return companyConfigFileSchema.parse(parsed);
}
