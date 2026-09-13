import { describe, expect, it } from "vitest";
import { laptops } from "./catalog";
import { fallbackParse, recommend } from "./recommendations";

const base = {
  currency: "INR" as const,
  minRam: 16,
  minStorage: 512,
  batteryImportance: 0.5,
  portabilityImportance: 0.5,
  performanceImportance: 0.7,
  valueImportance: 0.6,
};

describe("LaptopAI deterministic recommender", () => {
  it("keeps every returned result within the stated budget when eligible options exist", () => {
    const result = recommend({ ...base, budget: 80000, uses: ["gaming"], gamingImportance: 1, valueImportance: 0.7 });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((item) => item.laptop.price <= 80000)).toBe(true);
  });

  it("enforces GPU and memory constraints instead of ranking around them", () => {
    const result = recommend({ ...base, budget: 100000, uses: ["ai"], minRam: 16, minVram: 8, gpuRequired: true, aiImportance: 1 });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((item) => (item.laptop.vram ?? 0) >= 8 && !/integrated/i.test(item.laptop.gpu))).toBe(true);
  });

  it("responds to substantially different use cases and priorities", () => {
    const gaming = recommend({ ...base, budget: 120000, uses: ["gaming"], gamingImportance: 1, performanceImportance: 1, batteryImportance: 0.1, valueImportance: 0.2 });
    const programming = recommend({ ...base, budget: 120000, uses: ["programming"], programmingImportance: 1, portabilityImportance: 1, batteryImportance: 0.9, gamingImportance: 0.05 });
    const editing = recommend({ ...base, budget: 120000, uses: ["content"], editingImportance: 1, performanceImportance: 1, displayPreference: "color-accurate" });
    expect(gaming.results[0]?.laptop.gamingScore).toBeGreaterThanOrEqual(90);
    expect(programming.results[0]?.laptop.programmingScore).toBeGreaterThanOrEqual(90);
    expect(editing.results[0]?.laptop.editingScore).toBeGreaterThanOrEqual(90);
    expect(gaming.results.map((item) => item.laptop.id)).not.toEqual(programming.results.map((item) => item.laptop.id));
    expect(programming.results.map((item) => item.laptop.id)).not.toEqual(editing.results.map((item) => item.laptop.id));
  });

  it("keeps a budget student brief affordable and portability-oriented", () => {
    const result = recommend({ ...base, budget: 40000, uses: ["programming"], minRam: 8, minStorage: 256, programmingImportance: 0.7, batteryImportance: 1, portabilityImportance: 1, valueImportance: 1 });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]?.scoreBreakdown.budgetFit).toBeGreaterThanOrEqual(0);
    expect(result.results[0]?.scoreBreakdown.portability).toBeGreaterThan(50);
    expect(result.results[0]?.compromises.join(" ")).toContain("budget");
  });

  it("returns a GPU-equipped AI/ML shortlist for a 16 GB+ brief", () => {
    const result = recommend({ ...base, budget: 90000, uses: ["ai"], minRam: 16, minVram: 6, gpuRequired: true, aiImportance: 1, performanceImportance: 0.9 });
    expect(result.results[0]?.laptop.vram ?? 0).toBeGreaterThanOrEqual(6);
    expect(result.results[0]?.laptop.gpu).toMatch(/NVIDIA|GPU/i);
  });

  it("changes ranking when the budget and value priority change", () => {
    const value = recommend({ ...base, budget: 80000, uses: ["programming"], programmingImportance: 0.8, valueImportance: 1 });
    const premium = recommend({ ...base, budget: 130000, uses: ["programming"], programmingImportance: 0.8, performanceImportance: 1, valueImportance: 0.1 });
    expect(value.results.map((item) => item.laptop.id)).not.toEqual(premium.results.map((item) => item.laptop.id));
  });

  it("returns a controlled near-match list when hard constraints eliminate all candidates", () => {
    const result = recommend({ ...base, budget: 30000, uses: ["programming"], minRam: 64, minStorage: 4000 });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]?.compromises.join(" ")).toContain("budget");
  });

  it("is deterministic for the same inputs and catalog", () => {
    const first = recommend({ ...base, budget: 100000, uses: ["programming", "content"] }, laptops);
    const second = recommend({ ...base, budget: 100000, uses: ["programming", "content"] }, laptops);
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
