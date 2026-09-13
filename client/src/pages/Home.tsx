import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Cpu,
  Eye,
  Gamepad2,
  Gauge,
  GitCompareArrows,
  Layers3,
  Loader2,
  Menu,
  MessageSquareText,
  Monitor,
  Moon,
  MoveRight,
  Search,
  Sparkles,
  Star,
  Sun,
  X,
  Zap,
} from "lucide-react";
import type { Explanation, Laptop, ParsedRequirements, Recommendation, RecommendationRequirements, UseCase } from "@shared/types";

type Mode = "guided" | "brief";

const initialRequirements: RecommendationRequirements = {
  budget: 90000,
  currency: "INR",
  uses: ["programming", "content"],
  minRam: 16,
  minStorage: 512,
  minRefreshRate: undefined,
  batteryImportance: 0.65,
  portabilityImportance: 0.55,
  performanceImportance: 0.75,
  valueImportance: 0.7,
};

const useCases: Array<{ id: UseCase; label: string; hint: string; icon: typeof Code2 }> = [
  { id: "programming", label: "Programming", hint: "IDEs, containers, builds", icon: Code2 },
  { id: "gaming", label: "Gaming", hint: "High FPS & graphics", icon: Gamepad2 },
  { id: "content", label: "Content creation", hint: "Edit, design, export", icon: Layers3 },
  { id: "ai", label: "AI / ML", hint: "Local models & CUDA", icon: Sparkles },
];

const formatPrice = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function ScorePill({ value, label, dark = false }: { value: number; label: string; dark?: boolean }) {
  return (
    <div className={`score-pill ${dark ? "score-pill-dark" : ""}`}>
      <span>{Math.round(value)}</span>
      <small>{label}</small>
    </div>
  );
}

function LaptopVisual({ laptop, compact = false }: { laptop: Laptop; compact?: boolean }) {
  return (
    <div
      className={`laptop-visual ${compact ? "laptop-visual-compact" : ""}`}
      style={{ background: `linear-gradient(135deg, ${laptop.colors.from}, ${laptop.colors.to})`, color: laptop.colors.accent }}
      aria-label={`${laptop.brand} ${laptop.model} illustration`}
    >
      <div className="visual-topline"><span>{laptop.brand}</span><span className="visual-dot" /></div>
      <div className="visual-laptop">
        <div className="visual-screen"><div className="visual-screen-glow" /><span>{laptop.model.split(" ").slice(-1)[0]}</span></div>
        <div className="visual-base" />
      </div>
      {!compact && <div className="visual-caption"><span>Designed for focus</span><ArrowDownRight size={16} /></div>}
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("guided");
  const [requirements, setRequirements] = useState<RecommendationRequirements>(initialRequirements);
  const [brief, setBrief] = useState("I need a laptop for programming, creative work and occasional gaming under ₹90,000.");
  const [parsed, setParsed] = useState<ParsedRequirements | null>(null);
  const [selected, setSelected] = useState<Laptop | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const recommendMutation = trpc.recommend.useMutation();
  const parseMutation = trpc.ai.parseRequirements.useMutation();
  const explainMutation = trpc.ai.explain.useMutation();

  const recommendations = recommendMutation.data?.results ?? [];
  const selectedRecommendation = useMemo(() => recommendations.find((item) => item.laptop.id === selected?.id), [recommendations, selected]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const updateRequirement = <K extends keyof RecommendationRequirements>(key: K, value: RecommendationRequirements[K]) => {
    setRequirements((current) => ({ ...current, [key]: value }));
  };

  const toggleUse = (use: UseCase) => {
    setRequirements((current) => {
      const uses = current.uses.includes(use) ? current.uses.filter((item) => item !== use) : [...current.uses, use];
      return { ...current, uses: uses.length ? uses : [use] };
    });
  };

  const runRecommendation = () => {
    recommendMutation.mutate(requirements);
    window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const parseBrief = () => {
    parseMutation.mutate({ text: brief }, {
      onSuccess: (result) => {
        setParsed(result);
        setRequirements(result.requirements);
      },
    });
  };

  const openLaptop = (laptop: Laptop) => {
    setSelected(laptop);
    explainMutation.reset();
    window.setTimeout(() => document.getElementById("detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const toggleCompare = (id: number) => {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  };

  const selectedForCompare = recommendations.filter((result) => compareIds.includes(result.laptop.id));
  const explanation: Explanation | undefined = explainMutation.data ?? (selectedRecommendation ? undefined : undefined);

  return (
    <div className={`site-shell ${theme === "dark" ? "theme-dark" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="LaptopAI home"><span className="brand-mark"><Zap size={15} fill="currentColor" /></span><span>Laptop<span className="brand-ai">AI</span></span></a>
        <nav className={`main-nav ${mobileNav ? "main-nav-open" : ""}`} aria-label="Primary navigation">
          <a href="#how-it-works" onClick={() => setMobileNav(false)}>How it works</a>
          <a href="#results" onClick={() => setMobileNav(false)}>Explore picks</a>
          <a href="#methodology" onClick={() => setMobileNav(false)}>Our method</a>
        </nav>
        <div className="topbar-actions">
          <button className="icon-button theme-toggle" aria-label="Toggle theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
          <button className="compare-nav" onClick={() => setCompareOpen(true)}><GitCompareArrows size={16} /> Compare <span>{compareIds.length}</span></button>
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(!mobileNav)}><Menu size={20} /></button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section section-wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> PERSONALIZED HARDWARE, LESS NOISE</div>
            <h1>Find the laptop<br /><em>that fits you.</em></h1>
            <p className="hero-lede">A smarter shortlist for the way you actually work, create, play, and learn. Tell us what matters — we’ll handle the trade-offs.</p>
            <div className="hero-actions"><a className="button button-primary" href="#finder">Start your brief <ArrowRight size={17} /></a><a className="text-link" href="#how-it-works">See how it works <MoveRight size={16} /></a></div>
            <div className="trust-line"><div className="avatar-stack"><span>R</span><span>S</span><span>A</span></div><span>Built around real priorities, not spec-sheet theater.</span></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <div className="hero-note note-top"><span className="note-kicker">GOOD FIT</span><strong>Not just the<br />fastest one.</strong><ArrowDownRight size={21} /></div>
            <div className="hero-device"><div className="device-screen"><div className="device-window"><div /><div /><div /></div><div className="device-word">FIND<br /><span>YOUR</span><br />EDGE.</div></div><div className="device-base" /><div className="device-shadow" /></div>
            <div className="hero-note note-bottom"><Gauge size={19} /><span><strong>12+ signals</strong><br />weighted to your brief</span></div>
            <div className="hero-stamp">AI<br /><span>×</span><br />DATA</div>
          </div>
        </section>

        <section id="finder" className="finder-section section-wrap">
          <div className="section-kicker">01 / YOUR BRIEF</div>
          <div className="finder-heading"><div><h2>Start with what<br /><em>matters most.</em></h2></div><p>There is no “best laptop.” There is only the best fit for <em>your</em> kind of day.</p></div>
          <div className="finder-card">
            <div className="mode-tabs" role="tablist" aria-label="Requirement input mode"><button className={mode === "guided" ? "active" : ""} onClick={() => setMode("guided")}><span>01</span> Guided brief</button><button className={mode === "brief" ? "active" : ""} onClick={() => setMode("brief")}><span>02</span> Tell it naturally <Sparkles size={15} /></button></div>
            {mode === "brief" ? (
              <div className="brief-panel">
                <div className="brief-intro"><MessageSquareText size={23} /><div><h3>Put it in your own words.</h3><p>We’ll translate your needs into a structured brief you can edit before we rank anything.</p></div></div>
                <Textarea value={brief} onChange={(event) => setBrief(event.target.value)} className="brief-input" aria-label="Describe your laptop needs" />
                <div className="brief-footer"><span>Try: “I travel a lot, code all day, and want to play indie games.”</span><Button className="button-primary" onClick={parseBrief} disabled={parseMutation.isPending}>{parseMutation.isPending ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />} {parseMutation.isPending ? "Reading your brief…" : "Structure my brief"}</Button></div>
                {parsed && <div className="parsed-result"><div><span className="mini-label">TRANSLATED BRIEF</span><strong>{parsed.requirements.uses.map(titleCase).join(" + ")}</strong></div><div className="parsed-meta"><span>{formatPrice(parsed.requirements.budget)} budget</span><span>{parsed.requirements.minRam} GB RAM minimum</span><span>{Math.round(parsed.confidence * 100)}% confidence</span></div>{parsed.warnings.map((warning) => <p key={warning} className="warning"><CircleHelp size={14} /> {warning}</p>)}<Button variant="outline" onClick={() => { setMode("guided"); window.setTimeout(() => document.getElementById("guided-form")?.scrollIntoView({ behavior: "smooth" }), 50); }}>Review & edit <ArrowRight size={15} /></Button></div>}
              </div>
            ) : (
              <div id="guided-form" className="guided-panel">
                <div className="form-row form-row-budget"><div className="form-field budget-field"><Label htmlFor="budget">My budget is around</Label><div className="money-input"><span>₹</span><Input id="budget" type="number" value={requirements.budget} onChange={(event) => updateRequirement("budget", Number(event.target.value))} /><span className="input-suffix">INR</span></div><small>We’ll keep recommendations at or below this number.</small></div><div className="form-field"><Label htmlFor="ram">Minimum memory</Label><select id="ram" value={requirements.minRam} onChange={(event) => updateRequirement("minRam", Number(event.target.value))}><option value={8}>8 GB</option><option value={16}>16 GB</option><option value={32}>32 GB</option><option value={64}>64 GB</option></select></div><div className="form-field"><Label htmlFor="storage">Minimum storage</Label><select id="storage" value={requirements.minStorage} onChange={(event) => updateRequirement("minStorage", Number(event.target.value))}><option value={256}>256 GB</option><option value={512}>512 GB</option><option value={1000}>1 TB</option><option value={2000}>2 TB</option></select></div></div>
                <Separator />
                <div className="form-field use-field"><Label>What will you use it for?</Label><div className="use-grid">{useCases.map(({ id, label, hint, icon: Icon }) => <button type="button" key={id} className={`use-card ${requirements.uses.includes(id) ? "selected" : ""}`} onClick={() => toggleUse(id)}><span className="use-icon"><Icon size={19} /></span><span><strong>{label}</strong><small>{hint}</small></span><span className="checkmark">{requirements.uses.includes(id) && <Check size={13} />}</span></button>)}</div></div>
                <Separator />
                <div className="priority-header"><div><Label>How should we balance the trade-offs?</Label><small>These sliders shape the ranking. Nothing is hidden behind a black box.</small></div><span className="priority-legend"><span className="legend-dot" /> Your priorities</span></div>
                <div className="priority-grid">{([ ["performanceImportance", "Performance", "Speed when it counts", Gauge], ["batteryImportance", "Battery", "Fewer wall-hugging days", BatteryCharging], ["portabilityImportance", "Portability", "Light enough to move", MoveRight], ["valueImportance", "Value", "More for every rupee", Star] ] as const).map(([key, label, hint, Icon]) => <div className="priority-item" key={key}><div className="priority-label"><span><Icon size={15} /> {label}</span><b>{Math.round(requirements[key] * 100)}%</b></div><Slider value={[requirements[key] * 100]} max={100} step={5} onValueChange={([value]) => updateRequirement(key, value / 100)} aria-label={`${label} importance`} /><small>{hint}</small></div>)}</div>
                <div className="form-submit"><span><Zap size={15} /> Ranked from 8 curated machines</span><Button className="button-primary" onClick={runRecommendation} disabled={recommendMutation.isPending}>{recommendMutation.isPending ? <Loader2 className="spin" size={17} /> : <Search size={17} />} {recommendMutation.isPending ? "Finding your fit…" : "Find my best fits"} <ArrowRight size={17} /></Button></div>
              </div>
            )}
          </div>
        </section>

        <section id="results" className="results-section section-wrap">
          <div className="section-kicker">02 / YOUR SHORTLIST</div>
          <div className="results-heading"><div><h2>A shortlist with<br /><em>a point of view.</em></h2></div><div className="results-meta">{recommendations.length ? <><span className="live-dot" /> RANKED FOR YOUR BRIEF <b>·</b> {recommendMutation.data?.requestId}</> : <span>Run your brief to see tailored recommendations.</span>}</div></div>
          {!recommendations.length ? <div className="empty-results"><div className="empty-orbit"><Sparkles size={26} /></div><h3>Your best-fit list is waiting.</h3><p>Start with a guided brief above. We’ll score the trade-offs and show the reasoning behind every pick.</p><a className="button button-secondary" href="#finder">Build my brief <ArrowRight size={16} /></a></div> : <div className="results-grid">{recommendations.map((result) => <article className={`result-card ${result.rank === 1 ? "result-card-featured" : ""}`} key={result.laptop.id}><div className="result-card-top"><span className="rank">0{result.rank}</span><span className="fit-label">{result.rank === 1 ? "BEST OVERALL FIT" : `${result.confidence.toUpperCase()} CONFIDENCE`}</span><button className={`compare-check ${compareIds.includes(result.laptop.id) ? "active" : ""}`} onClick={() => toggleCompare(result.laptop.id)} aria-label={`Compare ${result.laptop.brand} ${result.laptop.model}`}>{compareIds.includes(result.laptop.id) ? <Check size={14} /> : <GitCompareArrows size={14} />}</button></div><LaptopVisual laptop={result.laptop} compact /><div className="result-card-body"><div className="result-brand">{result.laptop.brand}</div><h3>{result.laptop.model}</h3><p>{result.laptop.tagline}</p><div className="score-row"><div className="match-score"><strong>{Math.round(result.score)}%</strong><span>match</span></div><Progress value={result.score} className="match-progress" /><span className="match-confidence">{result.confidence}</span></div><div className="spec-row"><span><Cpu size={14} /> {result.laptop.cpu.replace(/(Intel|AMD|Apple) /, "")}</span><span><Layers3 size={14} /> {result.laptop.ram} GB · {result.laptop.storage} GB</span><span><Monitor size={14} /> {result.laptop.display}</span></div><div className="card-actions"><Button className="button-dark" onClick={() => openLaptop(result.laptop)}>See why it fits <ArrowRight size={15} /></Button><span className="card-price">{formatPrice(result.laptop.price)}</span></div></div></article>)}</div>}
        </section>

        {selected && selectedRecommendation && <section id="detail-panel" className="detail-section section-wrap"><div className="detail-back"><button onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back to shortlist</button><span>03 / DEEP DIVE</span></div><div className="detail-grid"><LaptopVisual laptop={selected} /><div className="detail-copy"><div className="result-brand">{selected.brand}</div><h2>{selected.model}</h2><p className="detail-tagline">{selected.tagline}</p><div className="detail-score"><div><strong>{Math.round(selectedRecommendation.score)}%</strong><span>match for your brief</span></div><div className="confidence-mark"><span className="live-dot" /> {selectedRecommendation.confidence} confidence</div></div><div className="score-breakdown"><span className="mini-label">SCORE BREAKDOWN</span>{Object.entries(selectedRecommendation.scoreBreakdown).slice(0, 6).map(([key, value]) => <div className="breakdown-row" key={key}><span>{titleCase(key)}</span><Progress value={value} /><b>{Math.round(value)}</b></div>)}</div><div className="detail-actions"><Button className="button-primary" onClick={() => explainMutation.mutate({ laptopId: selected.id, requirements, useAI: true })} disabled={explainMutation.isPending}>{explainMutation.isPending ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />} {explainMutation.isPending ? "Thinking with the facts…" : "Ask LaptopAI why"}</Button><Button variant="outline" onClick={() => toggleCompare(selected.id)}>{compareIds.includes(selected.id) ? <Check size={16} /> : <GitCompareArrows size={16} />} {compareIds.includes(selected.id) ? "In comparison" : "Add to compare"}</Button></div></div></div><div className="spec-sheet"><div><span className="mini-label">CORE SPECS</span><div className="spec-grid">{[["Processor", selected.cpu], ["Graphics", selected.gpu], ["Memory", `${selected.ram} GB RAM`], ["Storage", `${selected.storage} GB ${selected.storageType}`], ["Display", `${selected.display} · ${selected.resolution}`], ["Battery", selected.battery], ["Weight", `${selected.weight} kg`], ["Source", selected.source]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div></div>{explanation && <div className="explanation-card"><div className="explanation-header"><span><Sparkles size={16} /> GROUNDED EXPLANATION</span><Badge>Uses supplied facts</Badge></div><h3>{explanation.title}</h3><p>{explanation.summary}</p><div className="explanation-cols"><div><strong>Why it works</strong>{explanation.strengths.map((item) => <span key={item}><Check size={14} /> {item}</span>)}</div><div><strong>Trade-offs</strong>{explanation.compromises.map((item) => <span key={item}><ArrowDownRight size={14} /> {item}</span>)}</div></div><p className="profile-copy"><b>Best for:</b> {explanation.buyerProfile}</p><p className="profile-copy"><b>Skip it if:</b> {explanation.avoidProfile}</p></div>}</div></section>}

        <section id="how-it-works" className="method-section section-wrap"><div className="section-kicker">WHY LAPTOPAI</div><div className="method-heading"><h2>Less scrolling.<br /><em>More certainty.</em></h2><p>We turn a messy buying decision into a clear, explainable shortlist — without pretending one laptop wins for everyone.</p></div><div className="method-steps"><div><span>01</span><h3>Tell us the context.</h3><p>Budget and specs are a start. Your actual work, habits, and trade-offs matter more.</p></div><div><span>02</span><h3>We score the fit.</h3><p>A deterministic engine weights performance, battery, portability, value, and use-case signals.</p></div><div><span>03</span><h3>You see the why.</h3><p>Every pick comes with evidence, compromises, and a confidence level. No mystery ranking.</p></div></div></section>

        <section id="methodology" className="manifesto-section section-wrap"><div className="manifesto-card"><div className="manifesto-index">/ METHOD</div><div><h2>The fastest laptop<br />isn’t always the <em>right</em> one.</h2><p>Our rankings keep the math visible. AI can help translate your words or explain a result, but it never invents specs or chooses the winner. The recommendation engine stays in charge.</p><a className="text-link light-link" href="#finder">Build a brief that sounds like you <ArrowRight size={16} /></a></div><div className="manifesto-aside"><span>SCORING<br />VERSION</span><strong>v1.0</strong><span>CURATED<br />CATALOG</span><strong>08</strong></div></div></section>
      </main>

      {compareIds.length > 0 && <button className="compare-dock" onClick={() => setCompareOpen(true)}><GitCompareArrows size={17} /><span>{compareIds.length} selected for compare</span><ArrowRight size={16} /></button>}
      {compareOpen && <div className="overlay" role="dialog" aria-modal="true" aria-label="Laptop comparison"><div className="compare-modal"><div className="modal-header"><div><span className="mini-label">SIDE BY SIDE</span><h2>Compare your picks.</h2></div><button className="icon-button" onClick={() => setCompareOpen(false)} aria-label="Close comparison"><X size={19} /></button></div>{selectedForCompare.length < 2 ? <div className="compare-empty"><GitCompareArrows size={32} /><p>Select at least two laptops using the compare icon on each card.</p><Button className="button-primary" onClick={() => setCompareOpen(false)}>Keep exploring</Button></div> : <div className="compare-table-wrap"><div className="compare-table"><div className="compare-label-cell">SPECIFICATION</div>{selectedForCompare.map((result) => <div className="compare-product" key={result.laptop.id}><LaptopVisual laptop={result.laptop} compact /><strong>{result.laptop.brand} {result.laptop.model}</strong><span>{Math.round(result.score)}% match</span></div>)}{[["Price", (l: Laptop) => formatPrice(l.price)], ["Processor", (l: Laptop) => l.cpu], ["Graphics", (l: Laptop) => l.gpu], ["Memory", (l: Laptop) => `${l.ram} GB`], ["Storage", (l: Laptop) => `${l.storage} GB`], ["Display", (l: Laptop) => `${l.display} · ${l.refreshRate} Hz`], ["Battery", (l: Laptop) => `${l.battery} · ${l.batteryScore}/100`], ["Weight", (l: Laptop) => `${l.weight} kg`], ["Use-case fit", (l: Laptop) => `${l.gamingScore} gaming · ${l.programmingScore} code`]].map(([label, getter]) => <div className="compare-row" key={String(label)}><div className="compare-label-cell">{String(label)}</div>{selectedForCompare.map((result) => <div key={result.laptop.id} className="compare-value">{(getter as (laptop: Laptop) => string)(result.laptop)}</div>)}</div>)}</div></div>}<div className="modal-footer"><span><CircleHelp size={14} /> Scores reflect this brief, not a universal leaderboard.</span><Button variant="outline" onClick={() => { setCompareIds([]); setCompareOpen(false); }}>Clear selection</Button></div></div></div>}

      <footer className="footer section-wrap"><a className="brand" href="#top"><span className="brand-mark"><Zap size={15} fill="currentColor" /></span><span>Laptop<span className="brand-ai">AI</span></span></a><span>Data-grounded recommendations for real-world decisions.</span><span>Curated catalog · v2026.09</span></footer>
    </div>
  );
}
