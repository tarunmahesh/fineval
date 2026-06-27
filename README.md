# FinEval

Financial reasoning benchmark and RLHF preference pair generator, powered by Claude.

Built for Trata's Research Scientist Intern application. Demonstrates benchmark design, eval rubric construction, LLM-as-judge scoring, and preference pair generation for post-training pipelines.

**Live demo:** https://fineval-zeta.vercel.app

## What it does

**Benchmark runner** — runs a curated set of financial reasoning questions across five categories (Earnings Analysis, Ratio Interpretation, Macro vs. Micro Conflict, Sentiment vs. Fundamentals, Multi-step Reasoning) against Claude. Uses LLM-as-judge to score responses on four rubric dimensions (correctness, reasoning, calibration, domain precision) each 0-3, for a max of 12. Surfaces which known failure modes were exhibited and aggregates failure mode frequency across the full run.

**RLHF pair generator** — given a financial reasoning question, generates a (chosen, rejected) preference pair with an explicit rubric and failure mode label. The rejected response is designed to be plausibly wrong in ways LLMs actually fail — not obviously bad. Pairs export as JSONL for direct use in training pipelines.

## Benchmark categories and failure modes

Each question is designed to probe a specific reasoning gap:

- **Earnings Analysis** — overweighting topline vs margin, missing guidance deceleration
- **Ratio Interpretation** — accepting surface metrics without decomposition, missing liquidity vs solvency distinction
- **Macro vs. Micro Conflict** — defaulting to narrative over credit metrics, failing to specify data that resolves disagreement
- **Sentiment vs. Fundamentals** — not computing financial materiality, conflating quantifiable and tail risk
- **Multi-step Reasoning** — arithmetic errors in Rule of 40, trailing vs forward multiple confusion

## Setup

```bash
git clone https://github.com/tarunmahesh/fineval
cd fineval
npm install
cp .env.example .env.local
# add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open http://localhost:5173.

## Deploy

```bash
vercel --prod
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

## Stack

React + Vite, Tailwind CSS, Claude (claude-sonnet-4-6), Vercel