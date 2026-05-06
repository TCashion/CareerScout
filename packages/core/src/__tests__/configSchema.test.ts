import { describe, expect, it } from "vitest";

import { companyConfigFileSchema } from "../configSchema.js";

describe("companyConfigFileSchema", () => {
  it("accepts valid parser names", () => {
    const parsed = companyConfigFileSchema.parse({
      companies: [
        {
          id: "example",
          name: "Example",
          careersUrl: "https://example.com/careers",
          parser: "greenhouse",
          enabled: true,
          includeKeywords: ["software engineer"],
          excludeTerms: ["junior"],
          allowedLocations: ["remote"]
        }
      ]
    });

    expect(parsed.companies).toHaveLength(1);
  });

  it("rejects invalid parser names", () => {
    expect(() =>
      companyConfigFileSchema.parse({
        companies: [
          {
            id: "example",
            name: "Example",
            careersUrl: "https://example.com/careers",
            parser: "invalid",
            enabled: true,
            includeKeywords: ["software engineer"],
            excludeTerms: ["junior"],
            allowedLocations: ["remote"]
          }
        ]
      })
    ).toThrow();
  });
});
