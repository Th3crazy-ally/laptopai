import type {
  DisplayPreference,
  Explanation,
  Laptop,
  ParsedRequirements,
  Recommendation,
  RecommendationRequirements,
  ScoreBreakdown,
  UseCase,
} from "@shared/types";
import { CATALOG_VERSION, laptops } from "./catalog";

export const SCORING_VERSION = "deterministic-v2";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number, decimals = 1) => Number(value.toFixed(decimals));
const importance = (value: number | undefined, fallback: number) => clamp(Number(value ?? fallback) * 100) / 100;

const DEFAULT_REQUIREMENTS: RecommendationRequirements = {
  budget: 90000,
  currency: "INR",
  uses: ["programming"],
  minRam: 16,
  minStorage: 512,
  gamingImportance: 0.2,
  programmingImportance: 0.8,
  editingImportance: 0.2,
  aiImportance: 0.2,
  batteryImportance: 0.5,
  portabilityImportance: 0.5,
  performanceImportance: 0.7,
  valueImportance: 0.6,
};

export function normalizeRequirements(input: Partial<RecommendationRequirements>): RecommendationRequirements {
  const uses = Array.isArray(input.uses) && input.uses.length ? input.uses.filter(Boolean) : DEFAULT_REQUIREMENTS.uses;
  const selected = new Set(uses);
  return {
    budget: Math.max(25000, Number(input.budget ?? DEFAULT_REQUIREMENTS.budget)),
    currency: input.currency === "USD" ? "USD" : "INR",
    uses: Array.from(selected) as UseCase[],
    cpuPreference: input.cpuPreference?.trim() || undefined,
    gpuPreference: input.gpuPreference?.trim() || undefined,
    gpuRequired: Boolean(input.gpuRequired),
    minVram: input.minVram ? Math.max(1, Number(input.minVram)) : undefined,
    displayPreference: input.displayPreference ?? "any",
    minRam: Math.max(4, Number(input.minRam ?? DEFAULT_REQUIREMENTS.minRam)),
    minStorage: Math.max(128, Number(input.minStorage ?? DEFAULT_REQUIREMENTS.minStorage)),
    minRefreshRate: input.minRefreshRate ? Math.max(30, Number(input.minRefreshRate)) : undefined,
    gamingImportance: importance(input.gamingImportance, selected.has("gaming") ? 0.9 : 0.2),
    programmingImportance: importance(input.programmingImportance, selected.has("programming") ? 0.9 : 0.2),
    editingImportance: importance(input.editingImportance, selected.has("content") ? 0.9 : 0.2),
    aiImportance: importance(input.aiImportance, selected.has("ai") ? 0.9 : 0.2),
    batteryImportance: importance(input.batteryImportance, DEFAULT_REQUIREMENTS.batteryImportance),
    portabilityImportance: importance(input.portabilityImportance, DEFAULT_REQUIREMENTS.portabilityImportance),
    performanceImportance: importance(input.performanceImportance, DEFAULT_REQUIREMENTS.performanceImportance),
    valueImportance: importance(input.valueImportance, DEFAULT_REQUIREMENTS.valueImportance),
  };
}

const hasDedicatedGpu = (laptop: Laptop) => !/integrated|radeon 680m|arc integrated/i.test(laptop.gpu);
const preferenceMatch = (value: string, preference: string | undefined, baseline: number) => {
  if (!preference) return baseline;
  const normalized = preference.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return baseline;
  const tokens = normalized.split(/\s+/).filter((token) => token.length > 2);
  const haystack = value.toLowerCase();
  const matches = tokens.filter((token) => haystack.includes(token)).length;
  return matches === tokens.length ? 100 : matches > 0 ? 86 : baseline;
};

function useCaseScore(laptop: Laptop, requirements: RecommendationRequirements) {
  const weights: Array<[number, number]> = [
    [laptop.gamingScore, requirements.gamingImportance],
    [laptop.programmingScore, requirements.programmingImportance],
    [laptop.editingScore, requirements.editingImportance],
    [laptop.aiScore, requirements.aiImportance],
  ];
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  return total ? weights.reduce((sum, [score, weight]) => sum + score * weight, 0) / total : 70;
}

function budgetFit(laptop: Laptop, requirements: RecommendationRequirements) {
  if (laptop.price <= requirements.budget) {
    const headroom = (requirements.budget - laptop.price) / requirements.budget;
    return clamp(82 + headroom * 18);
  }
  return clamp(100 - ((laptop.price - requirements.budget) / requirements.budget) * 180);
}

function displayScore(laptop: Laptop, preference: DisplayPreference | undefined) {
  const refresh = clamp(50 + (laptop.refreshRate - 60) * 0.32);
  const color = /oled|retina|3k|2\.8k|3\.2k/i.test(`${laptop.display} ${laptop.resolution}`) ? 96 : 70;
  if (preference === "high-refresh") return refresh;
  if (preference === "color-accurate") return color;
  return (refresh + color) / 2;
}

function getBreakdown(laptop: Laptop, requirements: RecommendationRequirements): ScoreBreakdown {
  const budget = budgetFit(laptop, requirements);
  const memory = clamp(60 + (laptop.ram - requirements.minRam) * 4);
  const storage = clamp(60 + ((laptop.storage - requirements.minStorage) / Math.max(requirements.minStorage, 128)) * 30);
  const display = displayScore(laptop, requirements.displayPreference);
  const portability = clamp(110 - laptop.weight * 35);
  const cpu = preferenceMatch(laptop.cpu, requirements.cpuPreference, laptop.cpuScore);
  const gpu = preferenceMatch(laptop.gpu, requirements.gpuPreference, laptop.gpuScore);
  const useCase = useCaseScore(laptop, requirements);
  const performance = laptop.cpuScore * 0.38 + laptop.gpuScore * 0.42 + memory * 0.1 + display * 0.1;
  const value = clamp(laptop.valueScore * 0.6 + budget * 0.4);
  const signalWeights = [
    [performance, 1.1 + requirements.performanceImportance * 1.4],
    [useCase, 12],
    [budget, 1.8],
    [laptop.batteryScore, 0.5 + requirements.batteryImportance * 1.8],
    [portability, 0.5 + requirements.portabilityImportance * 1.8],
    [value, 0.5 + requirements.valueImportance * 1.8],
    [cpu, 0.5 + requirements.programmingImportance],
    [gpu, 0.5 + requirements.gamingImportance + requirements.aiImportance + requirements.editingImportance],
    [memory, 0.45 + requirements.programmingImportance + requirements.editingImportance + requirements.aiImportance],
    [storage, 0.35 + requirements.programmingImportance * 0.7 + requirements.editingImportance],
    [display, 0.35 + requirements.editingImportance + requirements.gamingImportance * 0.5],
  ] as Array<[number, number]>;
  const totalSignalWeight = signalWeights.reduce((sum, [, weight]) => sum + weight, 0);
  const overall = clamp(signalWeights.reduce((sum, [signal, weight]) => sum + signal * weight, 0) / totalSignalWeight);
  return {
    overall,
    performance,
    gaming: laptop.gamingScore,
    programming: laptop.programmingScore,
    editing: laptop.editingScore,
    ai: laptop.aiScore,
    cpu,
    gpu,
    memory,
    storage,
    display,
    battery: laptop.batteryScore,
    portability,
    useCase,
    value,
    budgetFit: budget,
  };
}

function batteryImportance(laptop: Laptop, requirements: RecommendationRequirements) {
  return laptop.batteryScore * requirements.batteryImportance;
}

function eligibility(laptop: Laptop, requirements: RecommendationRequirements) {
  const reasons: string[] = [];
  if (laptop.price > requirements.budget) reasons.push("Over your stated budget");
  if (laptop.ram < requirements.minRam) reasons.push(`Below your ${requirements.minRam} GB RAM minimum`);
  if (laptop.storage < requirements.minStorage) reasons.push(`Below your ${requirements.minStorage} GB storage minimum`);
  if (requirements.minRefreshRate && laptop.refreshRate < requirements.minRefreshRate) reasons.push(`Below your ${requirements.minRefreshRate} Hz refresh-rate minimum`);
  if (requirements.gpuRequired && !hasDedicatedGpu(laptop)) reasons.push("Does not have a dedicated GPU");
  if (requirements.minVram && (laptop.vram ?? 0) < requirements.minVram) reasons.push(`Below your ${requirements.minVram} GB VRAM minimum`);
  return { eligible: reasons.length === 0, reasons };
}

function nearMatchGap(laptop: Laptop, requirements: RecommendationRequirements) {
  const hard = eligibility(laptop, requirements).reasons;
  const overBudget = Math.max(0, laptop.price - requirements.budget) / Math.max(requirements.budget, 1);
  return hard.length * 45 + overBudget * 100 + Math.max(0, requirements.minRam - laptop.ram) * 2 + Math.max(0, requirements.minStorage - laptop.storage) / 64;
}

function buildReasons(laptop: Laptop, requirements: RecommendationRequirements, breakdown: ScoreBreakdown) {
  const reasons: string[] = [];
  if (requirements.gamingImportance >= 0.65) reasons.push(`${laptop.gpu} delivers a ${laptop.gamingScore}/100 gaming fit`);
  if (requirements.programmingImportance >= 0.65) reasons.push(`${laptop.cpu} and ${laptop.ram} GB RAM support development workflows`);
  if (requirements.editingImportance >= 0.65) reasons.push(`${laptop.display} and ${laptop.editingScore}/100 editing fit support creative work`);
  if (requirements.aiImportance >= 0.65) reasons.push(`${laptop.gpu} with ${laptop.vram ?? 0} GB VRAM supports local AI/ML`);
  if (breakdown.budgetFit >= 85) reasons.push(`Strong budget fit at ₹${laptop.price.toLocaleString("en-IN")}`);
  if (requirements.batteryImportance >= 0.7 && laptop.batteryScore >= 85) reasons.push(`Battery score ${laptop.batteryScore}/100 matches your priority`);
  if (requirements.portabilityImportance >= 0.7 && breakdown.portability >= 75) reasons.push(`Portable ${laptop.weight} kg chassis`);
  return reasons.slice(0, 3);
}

export function recommend(input: Partial<RecommendationRequirements>, catalog = laptops): { requirements: RecommendationRequirements; results: Recommendation[]; scoringVersion: string; catalogVersion: string } {
  const requirements = normalizeRequirements(input);
  const eligible = catalog.filter((laptop) => eligibility(laptop, requirements).eligible);
  const candidates = eligible.length ? eligible : [...catalog].sort((a, b) => nearMatchGap(a, requirements) - nearMatchGap(b, requirements) || b.valueScore - a.valueScore).slice(0, 5);
  const results = candidates.map((laptop) => {
    const breakdown = getBreakdown(laptop, requirements);
    const hardReasons = eligibility(laptop, requirements).reasons;
    const hardPenalty = hardReasons.length ? Math.min(60, hardReasons.length * 18) : 0;
    const score = clamp(breakdown.overall - hardPenalty);
    const compromises: string[] = [];
    if (laptop.weight > 2) compromises.push("Heavier than the portable picks");
    if (laptop.batteryScore < 80) compromises.push("Battery endurance is a trade-off under demanding workloads");
    if (laptop.valueScore < 80) compromises.push("Premium pricing means value is not its strongest point");
    compromises.push(...hardReasons);
    const confidence: Recommendation["confidence"] = score >= 84 && hardReasons.length === 0 ? "High" : score >= 70 ? "Medium" : "Low";
    const roundedBreakdown = Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, round(value)])) as ScoreBreakdown;
    return {
      laptop,
      rank: 0,
      score: round(score),
      confidence,
      scoreBreakdown: roundedBreakdown,
      reasons: buildReasons(laptop, requirements, breakdown),
      compromises: compromises.slice(0, 4),
      evidence: [
        `${laptop.cpu} · ${laptop.gpu}`,
        `${laptop.ram} GB RAM · ${laptop.storage} GB ${laptop.storageType}`,
        `${laptop.display} · ${laptop.refreshRate} Hz · ${laptop.weight} kg`,
        `Budget fit ${Math.round(breakdown.budgetFit)}/100 · use-case fit ${Math.round(breakdown.useCase)}/100`,
      ],
    };
  }).sort((a, b) => {
    if (!eligible.length) {
      return nearMatchGap(a.laptop, requirements) - nearMatchGap(b.laptop, requirements) || b.score - a.score || a.laptop.id - b.laptop.id;
    }
    return b.score - a.score || b.scoreBreakdown.useCase - a.scoreBreakdown.useCase || a.laptop.id - b.laptop.id;
  })
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
    requirements: normalizeRequirements({
      budget,
      uses,
      minRam,
      minStorage,
      currency: "INR",
      gamingImportance: uses.includes("gaming") ? 0.9 : 0.2,
      programmingImportance: uses.includes("programming") ? 0.9 : 0.2,
      editingImportance: uses.includes("content") ? 0.9 : 0.2,
      aiImportance: uses.includes("ai") ? 0.9 : 0.2,
      performanceImportance: uses.includes("gaming") || uses.includes("ai") ? 0.85 : 0.7,
      valueImportance: 0.7,
    }),
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
