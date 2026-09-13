import type {
  Explanation,
  Laptop,
  ParsedRequirements,
  Recommendation,
  RecommendationRequirements,
  ScoreBreakdown,
  UseCase,
} from "@shared/types";
import { CATALOG_VERSION, laptops } from "./catalog";

export const SCORING_VERSION = "deterministic-v1";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number, decimals = 1) => Number(value.toFixed(decimals));

const DEFAULT_REQUIREMENTS: RecommendationRequirements = {
  budget: 90000,
  currency: "INR",
  uses: ["programming"],
  minRam: 16,
  minStorage: 512,
  batteryImportance: 0.5,
  portabilityImportance: 0.5,
  performanceImportance: 0.7,
  valueImportance: 0.6,
};

export function normalizeRequirements(input: Partial<RecommendationRequirements>): RecommendationRequirements {
  const uses = Array.isArray(input.uses) && input.uses.length ? input.uses.filter(Boolean) : DEFAULT_REQUIREMENTS.uses;
  return {
    budget: Math.max(25000, Number(input.budget ?? DEFAULT_REQUIREMENTS.budget)),
    currency: input.currency === "USD" ? "USD" : "INR",
    uses: Array.from(new Set(uses)) as UseCase[],
    cpuPreference: input.cpuPreference?.trim() || undefined,
    gpuPreference: input.gpuPreference?.trim() || undefined,
    minRam: Math.max(4, Number(input.minRam ?? DEFAULT_REQUIREMENTS.minRam)),
    minStorage: Math.max(128, Number(input.minStorage ?? DEFAULT_REQUIREMENTS.minStorage)),
    minRefreshRate: input.minRefreshRate ? Math.max(30, Number(input.minRefreshRate)) : undefined,
    batteryImportance: clamp(Number(input.batteryImportance ?? DEFAULT_REQUIREMENTS.batteryImportance) * 100) / 100,
    portabilityImportance: clamp(Number(input.portabilityImportance ?? DEFAULT_REQUIREMENTS.portabilityImportance) * 100) / 100,
    performanceImportance: clamp(Number(input.performanceImportance ?? DEFAULT_REQUIREMENTS.performanceImportance) * 100) / 100,
    valueImportance: clamp(Number(input.valueImportance ?? DEFAULT_REQUIREMENTS.valueImportance) * 100) / 100,
  };
}

function useCaseScore(laptop: Laptop, uses: UseCase[]) {
  if (!uses.length) return 70;
  const scores = uses.map((use) => {
    if (use === "gaming") return laptop.gamingScore;
    if (use === "programming") return laptop.programmingScore;
    if (use === "content") return laptop.editingScore;
    return laptop.aiScore;
  });
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function getBreakdown(laptop: Laptop, requirements: RecommendationRequirements): ScoreBreakdown {
  const priceFit = laptop.price <= requirements.budget ? 100 : clamp(100 - ((laptop.price - requirements.budget) / requirements.budget) * 140);
  const memory = clamp(55 + (laptop.ram - requirements.minRam) * 5);
  const storage = clamp(55 + ((laptop.storage - requirements.minStorage) / requirements.minStorage) * 35);
  const display = clamp(50 + (laptop.refreshRate - 60) * 0.22 + (laptop.displaySize >= 15 ? 4 : 0));
  const portability = clamp(110 - laptop.weight * 35);
  const preferenceCpu = requirements.cpuPreference && laptop.cpu.toLowerCase().includes(requirements.cpuPreference.toLowerCase()) ? 100 : laptop.cpuScore;
  const preferenceGpu = requirements.gpuPreference && laptop.gpu.toLowerCase().includes(requirements.gpuPreference.toLowerCase()) ? 100 : laptop.gpuScore;

  return {
    cpu: preferenceCpu,
    gpu: preferenceGpu,
    memory,
    storage,
    display,
    battery: laptop.batteryScore,
    portability,
    useCase: useCaseScore(laptop, requirements.uses),
    value: (laptop.valueScore * 0.7) + (priceFit * 0.3),
  };
}

function getWeights(requirements: RecommendationRequirements) {
  const gaming = requirements.uses.includes("gaming");
  const programming = requirements.uses.includes("programming");
  const content = requirements.uses.includes("content");
  const ai = requirements.uses.includes("ai");
  return {
    cpu: 0.9 + requirements.performanceImportance * 0.65 + (programming ? 0.35 : 0) + (content ? 0.2 : 0) + (ai ? 0.2 : 0),
    gpu: 0.55 + requirements.performanceImportance * 0.45 + (gaming ? 0.9 : 0) + (content ? 0.45 : 0) + (ai ? 0.75 : 0),
    memory: 0.65 + (programming ? 0.45 : 0) + (content ? 0.45 : 0) + (ai ? 0.55 : 0),
    storage: 0.5 + (content ? 0.35 : 0) + (programming ? 0.2 : 0),
    display: 0.5 + (content ? 0.45 : 0) + (gaming ? 0.25 : 0),
    battery: 0.45 + requirements.batteryImportance * 1.2,
    portability: 0.45 + requirements.portabilityImportance * 1.2,
    useCase: 1.1 + (gaming || programming || content || ai ? 0.45 : 0),
    value: 0.45 + requirements.valueImportance * 1.2,
  };
}

function eligibility(laptop: Laptop, requirements: RecommendationRequirements) {
  const reasons: string[] = [];
  if (laptop.price > requirements.budget) reasons.push("Over your stated budget");
  if (laptop.ram < requirements.minRam) reasons.push(`Below your ${requirements.minRam} GB RAM minimum`);
  if (laptop.storage < requirements.minStorage) reasons.push(`Below your ${requirements.minStorage} GB storage minimum`);
  if (requirements.minRefreshRate && laptop.refreshRate < requirements.minRefreshRate) reasons.push(`Below your ${requirements.minRefreshRate} Hz refresh-rate minimum`);
  return { eligible: reasons.length === 0, reasons };
}

function buildReasons(laptop: Laptop, requirements: RecommendationRequirements, breakdown: ScoreBreakdown) {
  const reasons: string[] = [];
  if (requirements.uses.includes("gaming")) reasons.push(`${laptop.gpu} delivers a ${laptop.gamingScore}/100 gaming fit`);
  if (requirements.uses.includes("programming")) reasons.push(`${laptop.cpu} and ${laptop.ram} GB RAM make it strong for development workflows`);
  if (requirements.uses.includes("content")) reasons.push(`${laptop.display} and ${laptop.editingScore}/100 editing fit support creative work`);
  if (requirements.uses.includes("ai")) reasons.push(`${laptop.gpu} with ${laptop.vram ?? 0} GB VRAM is a capable local-AI starting point`);
  if (breakdown.value >= 85) reasons.push(`Strong value at ₹${laptop.price.toLocaleString("en-IN")}`);
  if (breakdown.portability >= 75) reasons.push(`Portable ${laptop.weight} kg chassis with ${laptop.battery}`);
  return reasons.slice(0, 3);
}

export function recommend(input: Partial<RecommendationRequirements>, catalog = laptops): { requirements: RecommendationRequirements; results: Recommendation[]; scoringVersion: string; catalogVersion: string } {
  const requirements = normalizeRequirements(input);
  const weights = getWeights(requirements);
  const eligible = catalog.filter((laptop) => eligibility(laptop, requirements).eligible);
  const candidates = eligible.length ? eligible : [...catalog].sort((a, b) => {
    const aGap = Math.max(0, requirements.minRam - a.ram) + Math.max(0, requirements.minStorage - a.storage) / 128 + Math.max(0, a.price - requirements.budget) / 10000;
    const bGap = Math.max(0, requirements.minRam - b.ram) + Math.max(0, requirements.minStorage - b.storage) / 128 + Math.max(0, b.price - requirements.budget) / 10000;
    return aGap - bGap || b.valueScore - a.valueScore;
  }).slice(0, 5);
  const results = candidates.map((laptop) => {
    const breakdown = getBreakdown(laptop, requirements);
    const weightEntries = Object.entries(weights) as [keyof ScoreBreakdown, number][];
    const totalWeight = weightEntries.reduce((sum, [, weight]) => sum + weight, 0);
    const weighted = weightEntries.reduce((sum, [key, weight]) => sum + breakdown[key] * weight, 0) / totalWeight;
    const overBudgetPenalty = laptop.price > requirements.budget ? Math.min(28, ((laptop.price - requirements.budget) / requirements.budget) * 100) : 0;
    const missingDataPenalty = 0;
    const score = clamp(weighted - overBudgetPenalty - missingDataPenalty);
    const eligibilityReasons = eligibility(laptop, requirements).reasons;
    const compromises: string[] = [];
    if (laptop.weight > 2) compromises.push("Heavier than the portable picks");
    if (laptop.batteryScore < 80) compromises.push("Battery endurance is a trade-off under demanding workloads");
    if (laptop.valueScore < 80) compromises.push("Premium pricing means value is not its strongest point");
    if (eligibilityReasons.length) compromises.push(...eligibilityReasons);
    const confidence: Recommendation["confidence"] = score >= 84 && laptop.buildScore >= 80 ? "High" : score >= 72 ? "Medium" : "Low";
    return {
      laptop,
      rank: 0,
      score: round(score),
      confidence,
      scoreBreakdown: Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, round(value)])) as ScoreBreakdown,
      reasons: buildReasons(laptop, requirements, breakdown),
      compromises: compromises.slice(0, 3),
      evidence: [
        `${laptop.cpu} · ${laptop.gpu}`,
        `${laptop.ram} GB RAM · ${laptop.storage} GB ${laptop.storageType}`,
        `${laptop.display} · ${laptop.refreshRate} Hz · ${laptop.weight} kg`,
      ],
    };
  }).sort((a, b) => b.score - a.score || b.laptop.valueScore - a.laptop.valueScore || a.laptop.id - b.laptop.id)
    .slice(0, 5)
    .map((result, index) => ({ ...result, rank: index + 1 }));

  return { requirements, results, scoringVersion: SCORING_VERSION, catalogVersion: CATALOG_VERSION };
}

export function fallbackParse(text: string): ParsedRequirements {
  const normalized = text.toLowerCase();
  const budgetMatch = text.replace(/,/g, "").match(/(?:₹|rs\.?|inr|under|below)\s*(\d{4,6})/i) ?? text.match(/\b(\d{5,6})\b/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : DEFAULT_REQUIREMENTS.budget;
  const uses: UseCase[] = [];
  if (/program|code|developer|software|devops/.test(normalized)) uses.push("programming");
  if (/gaming|game|fps|gpu/.test(normalized)) uses.push("gaming");
  if (/edit|premiere|video|creator|content/.test(normalized)) uses.push("content");
  if (/ai|machine learning|ml|deep learning|cuda/.test(normalized)) uses.push("ai");
  const ramMatch = normalized.match(/(\d{1,2})\s*(?:gb)?\s*ram/);
  const storageMatch = normalized.match(/(\d{3,4})\s*(?:gb|tb)?\s*(?:storage|ssd|disk)/);
  const minRam = ramMatch ? Number(ramMatch[1]) : 16;
  const minStorage = storageMatch ? (normalized.includes("tb") ? Number(storageMatch[1]) * 1024 : Number(storageMatch[1])) : 512;
  const warnings: string[] = [];
  const assumptions: string[] = [];
  if (!budgetMatch) assumptions.push("Used a ₹90,000 planning budget because no budget was detected.");
  if (!uses.length) {
    uses.push("programming");
    warnings.push("No primary use case was detected; programming is selected as a neutral default.");
  }
  return {
    requirements: normalizeRequirements({ budget, uses, minRam, minStorage, currency: "INR", performanceImportance: uses.includes("gaming") || uses.includes("ai") ? 0.85 : 0.7, valueImportance: 0.7 }),
    confidence: budgetMatch && !warnings.length ? 0.78 : 0.54,
    warnings,
    assumptions,
    source: "fallback",
  };
}

export function createFallbackExplanation(result: Recommendation, requirements: RecommendationRequirements): Explanation {
  const useLabel = requirements.uses.map((use) => ({ programming: "programming", gaming: "gaming", content: "creative work", ai: "local AI/ML" }[use])).join(", ");
  return {
    title: `Why ${result.laptop.brand} ${result.laptop.model}?`,
    summary: `It scores ${result.score}% for your ${useLabel} brief, balancing the requirements you marked as important against the available catalog data.`,
    strengths: result.reasons,
    compromises: result.compromises.length ? result.compromises : ["No major compromises were identified in the supplied data."],
    buyerProfile: `A good fit for someone prioritizing ${useLabel} with a budget around ₹${requirements.budget.toLocaleString("en-IN")}.`,
    avoidProfile: "Look elsewhere if your must-have requirements change or if you need live pricing and availability guarantees.",
    grounded: true,
  };
}
