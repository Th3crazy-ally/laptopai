# Recommendation methodology

LaptopAI treats recommendation as a constrained ranking problem rather than a generative answer. The scorer is versioned (`deterministic-v1`) and produces a rank, score breakdown, evidence list, confidence level, reasons, and compromises for each result.

## Pipeline

1. Normalize budget, units, priorities, and use-case labels.
2. Apply hard constraints for budget, minimum RAM, minimum storage, and optional refresh rate.
3. Calculate component signals for CPU, GPU, memory, storage, display, battery, portability, use-case fit, and value.
4. Apply dynamic weights based on programming, gaming, content, AI/ML, performance, battery, portability, and value priorities.
5. Aggregate the available components, apply transparent over-budget penalties for the near-match fallback, and sort with stable tie-breakers.
6. Return the top five candidates with factual evidence and explainable trade-offs.

The conceptual aggregate is:

```text
overall = 100 × weighted_average(available components) × data_quality_factor − soft penalties
```

The MVP catalog has complete values for its scored fields, so the data-quality factor remains neutral. Future imports should not convert unknown values to zero. Missing values should make a candidate ineligible for a minimum constraint or reduce confidence for an optional component.

## Use-case weighting

Gaming increases GPU and gaming-fit weight. Programming increases CPU, memory, and portability weight. Content creation increases CPU, GPU, memory, storage, and display weight. AI/ML increases GPU/VRAM, CPU, memory, and AI-fit weight. Explicit importance sliders are bounded from 0 to 1 and are combined with these use-case weights.

## What scores mean

A match percentage measures how well a laptop fits the supplied brief and catalog evidence. It is not a universal quality score. Confidence reflects catalog completeness, constraint clarity, score provenance, and the margin between candidates. Explanations should state compromises rather than hide them.

## AI boundary

AI may translate natural-language requirements and summarize supplied recommendation evidence. It must not select products, invent missing facts, or override hard constraints. If parsing fails, the user receives a deterministic fallback plus editable fields. If explanation generation fails, the user receives a deterministic grounded template.
