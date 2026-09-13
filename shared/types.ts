export type Currency = "INR" | "USD";

export type UseCase = "programming" | "gaming" | "content" | "ai";
export type DisplayPreference = "any" | "high-refresh" | "color-accurate";

export type Laptop = {
  id: number;
  brand: string;
  model: string;
  slug: string;
  tagline: string;
  price: number;
  currency: Currency;
  cpu: string;
  cpuScore: number;
  gpu: string;
  gpuScore: number;
  ram: number;
  storage: number;
  storageType: "SSD" | "NVMe SSD";
  display: string;
  displaySize: number;
  resolution: string;
  refreshRate: number;
  battery: string;
  batteryScore: number;
  weight: number;
  gamingScore: number;
  programmingScore: number;
  editingScore: number;
  aiScore: number;
  buildScore: number;
  valueScore: number;
  vram?: number;
  colors: { from: string; to: string; accent: string };
  source: string;
  updatedAt: string;
};

export type RecommendationRequirements = {
  budget: number;
  currency: Currency;
  uses: UseCase[];
  cpuPreference?: string;
  gpuPreference?: string;
  brandPreference?: string;
  osPreference?: string;
  gpuRequired?: boolean;
  minVram?: number;
  maxWeight?: number;
  displayPreference?: DisplayPreference;
  minRam: number;
  minStorage: number;
  minRefreshRate?: number;
  gamingImportance: number;
  programmingImportance: number;
  editingImportance: number;
  aiImportance: number;
  batteryImportance: number;
  portabilityImportance: number;
  performanceImportance: number;
  valueImportance: number;
};

export type ScoreBreakdown = {
  overall: number;
  performance: number;
  gaming: number;
  programming: number;
  editing: number;
  ai: number;
  cpu: number;
  gpu: number;
  memory: number;
  storage: number;
  display: number;
  battery: number;
  portability: number;
  useCase: number;
  value: number;
  budgetFit: number;
  preference: number;
};

export type Recommendation = {
  laptop: Laptop;
  rank: number;
  score: number;
  confidence: "High" | "Medium" | "Low";
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
  compromises: string[];
  evidence: string[];
  nearMatch: boolean;
  constraintViolations: string[];
};

export type ParsedRequirements = {
  requirements: RecommendationRequirements;
  confidence: number;
  warnings: string[];
  assumptions: string[];
  source: "ai" | "fallback";
};

export type Explanation = {
  title: string;
  summary: string;
  strengths: string[];
  compromises: string[];
  buyerProfile: string;
  avoidProfile: string;
  grounded: boolean;
};
