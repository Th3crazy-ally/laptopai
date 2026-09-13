import { describe, expect, it } from "vitest";
import { laptops } from "./catalog";
import { fallbackParse, recommend } from "./recommendations";

describe("LaptopAI deterministic recommender", () => {
  it("keeps every returned result within the stated budget when eligible options exist", () => {
    const result = recommend({ budget: 80000, uses: ["gaming"], minRam: 16, minStorage: 512, valueImportance: 0.7 });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((item) => item.laptop.price <= 80000)).toBe(true);
  });

  it("responds to use-case priorities", () => {
    const gaming = recommend({ budget: 120000, uses: ["gaming"], minRam: 16, minStorage: 512, performanceImportance: 1, valueImportance: 0.2 });
    const programming = recommend({ budget: 120000, uses: ["programming"], minRam: 16, minStorage: 512, performanceImportance: 0.7, portabilityImportance: 0.9 });
    expect(gaming.results[0]?.laptop.gamingScore).toBeGreaterThanOrEqual(90);
    expect(programming.results[0]?.laptop.programmingScore).toBeGreaterThanOrEqual(90);
  });

  it("returns a controlled near-match list when hard constraints eliminate all candidates", () => {
    const result = recommend({ budget: 30000, uses: ["programming"], minRam: 64, minStorage: 4000 });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]?.compromises.join(" ")).toContain("budget");
  });

  it("is deterministic for the same inputs and catalog", () => {
    const first = recommend({ budget: 100000, uses: ["programming", "content"], minRam: 16, minStorage: 512 }, laptops);
    const second = recommend({ budget: 100000, uses: ["programming", "content"], minRam: 16, minStorage: 512 }, laptops);
    expect(first.results.map((item) => item.laptop.id)).toEqual(second.results.map((item) => item.laptop.id));
    expect(first.results.map((item) => item.score)).toEqual(second.results.map((item) => item.score));
  });

  it("parses a natural-language brief without selecting a product", () => {
    const parsed = fallbackParse("I need a laptop under ₹80,000 for programming, gaming and occasional video editing with 32 GB RAM.");
    expect(parsed.requirements.budget).toBe(80000);
    expect(parsed.requirements.uses).toEqual(["programming", "gaming", "content"]);
    expect(parsed.requirements.minRam).toBe(32);
    expect(parsed.source).toBe("fallback");
  });
});
