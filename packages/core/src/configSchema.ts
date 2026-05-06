import { z } from "zod";

export const parserTypeSchema = z.enum(["greenhouse", "lever", "genericHtml"]);

const nonEmptyStringArraySchema = z.array(z.string().trim().min(1)).min(1);

export const companyConfigSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  careersUrl: z.string().trim().url(),
  parser: parserTypeSchema,
  enabled: z.boolean().default(true),
  includeKeywords: nonEmptyStringArraySchema,
  excludeTerms: nonEmptyStringArraySchema,
  allowedLocations: nonEmptyStringArraySchema,
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const companyConfigFileSchema = z.object({
  companies: z.array(companyConfigSchema).min(1)
});

export type CompanyConfig = z.infer<typeof companyConfigSchema>;
export type CompanyConfigFile = z.infer<typeof companyConfigFileSchema>;
