/**
 * Curated benchmark questions for financial reasoning evaluation.
 * Each question is designed to probe a specific reasoning capability
 * and expose known LLM failure modes in finance contexts.
 *
 * Scoring rubric dimensions (0-3 each):
 *   correctness    - factual and numerical accuracy
 *   reasoning      - quality of analytical chain
 *   calibration    - appropriate uncertainty; no overconfidence
 *   precision      - domain-specific terminology and framing
 */

export const CATEGORIES = [
  'Earnings Analysis',
  'Ratio Interpretation',
  'Macro vs. Micro Conflict',
  'Sentiment vs. Fundamentals',
  'Multi-step Reasoning',
]

export const QUESTIONS = [
  {
    id: 'earn_001',
    category: 'Earnings Analysis',
    difficulty: 'medium',
    prompt: `Company X reported Q3 results: Revenue $2.1B (+12% YoY), Gross Margin 34.2% (vs 38.1% prior year), Operating Income $180M (-23% YoY), EPS $0.42 (vs Street consensus $0.51). Management guided Q4 revenue of $1.9B-$2.0B vs prior year Q4 of $2.05B.

What are the two or three most important concerns an analyst should flag, and why?`,
    rubric: {
      correctness: 'Must identify gross margin compression (~390bps) as primary concern; EPS miss; Q4 guidance implying YoY deceleration.',
      reasoning: 'Should prioritize margin over topline; explain operating leverage failure; note guidance midpoint implies -5% YoY.',
      calibration: 'Should not dismiss margin compression as one-time without evidence from the prompt.',
      precision: 'Should use terms like operating leverage, margin compression, deceleration — not just "profits fell".',
    },
    knownFailureModes: [
      'Overweighting headline revenue growth vs margin deterioration',
      'Missing that guidance midpoint implies YoY decline',
      'Treating EPS miss as primary concern vs structural margin issue',
    ],
  },
  {
    id: 'ratio_001',
    category: 'Ratio Interpretation',
    difficulty: 'medium',
    prompt: `A manufacturing company has the following metrics:
- Current Ratio: 2.8x
- Quick Ratio: 0.6x
- Days Inventory Outstanding: 210 days
- Gross Margin: 41%
- Peers average Current Ratio: 1.8x, Quick Ratio: 1.3x, DIO: 85 days

A junior analyst says the company looks "very liquid" based on the current ratio. Is the analyst correct? What does the full picture suggest?`,
    rubric: {
      correctness: 'Must identify that high current ratio is driven by inventory bloat, not true liquidity. Quick ratio below 1.0 means illiquid on a cash basis.',
      reasoning: 'Should connect DIO of 210 vs 85 peer average to current ratio inflation; recognize inventory risk.',
      calibration: 'Should flag that 210 DIO could indicate obsolescence risk or demand weakness, not just inefficiency.',
      precision: 'Should distinguish liquidity from solvency; use quick ratio as the corrective metric explicitly.',
    },
    knownFailureModes: [
      'Accepting current ratio at face value without decomposing it',
      'Not connecting DIO to inventory quality risk',
      'Missing that quick ratio below 1.0 is a red flag regardless of current ratio',
    ],
  },
  {
    id: 'macro_001',
    category: 'Macro vs. Micro Conflict',
    difficulty: 'hard',
    prompt: `The Fed has cut rates 75bps over the last two meetings. A regional bank reports: NIM expanding 18bps QoQ, loan growth +9% YoY, NPL ratio 1.1% (up from 0.7% six months ago), charge-off rate 0.8% (up from 0.3%).

A macro-focused PM argues this is a "rate cut winner" and wants to add. A credit-focused analyst flags the NPL and charge-off trends. Who is more likely correct, and what additional data would resolve the debate?`,
    rubric: {
      correctness: 'Credit deterioration (NPLs nearly doubled, charge-offs nearly tripled) is a leading indicator that typically precedes NIM benefits being offset. Credit analyst is likely more correct near-term.',
      reasoning: 'Should recognize NIM expansion is a lagging benefit while credit deterioration is a leading risk; rate cuts help funding costs but do not fix existing credit issues.',
      calibration: 'Should acknowledge uncertainty and specify what data resolves it (vintage analysis, sector concentration, reserve coverage ratio).',
      precision: 'Should mention reserve coverage, loss given default, or loan-to-deposit ratio as relevant data points.',
    },
    knownFailureModes: [
      'Defaulting to macro narrative without analyzing credit metrics',
      'Not recognizing that NPL doubling in 6 months is a severe rate of change',
      'Failing to suggest concrete data that would resolve the disagreement',
    ],
  },
  {
    id: 'sent_001',
    category: 'Sentiment vs. Fundamentals',
    difficulty: 'hard',
    prompt: `A consumer staples company receives overwhelmingly negative press after a product recall affecting 0.3% of one SKU. The stock drops 18% in two days. Fundamentals: the recalled SKU represents 1.2% of revenue, recall costs estimated at $40M pre-tax, the company has $2.1B in annual EBITDA and $800M in cash, and the core brand has 60+ years of customer trust with 94% brand recall scores in surveys.

Is this a buying opportunity, a value trap, or insufficient information to conclude? Walk through your reasoning.`,
    rubric: {
      correctness: 'Financial impact is small (~1.9% of EBITDA one-time). 18% drawdown implies market pricing something larger (reputational contagion, regulatory risk, or class action). Likely overreaction on pure financials but reputational tail risk is real.',
      reasoning: 'Should quantify the financial impact relative to the market cap decline; recognize the mismatch; but also flag non-quantifiable risks.',
      calibration: 'Should not confidently call it a buy without flagging regulatory and litigation tail risk. Should not dismiss as obvious value trap either.',
      precision: 'Should mention enterprise value impact, not just stock price; should reference tail risk explicitly.',
    },
    knownFailureModes: [
      'Declaring it a buy without quantifying tail risks',
      'Treating sentiment as the primary signal rather than computing financial materiality',
      'Not recognizing the asymmetry between quantifiable and non-quantifiable risks',
    ],
  },
  {
    id: 'multi_001',
    category: 'Multi-step Reasoning',
    difficulty: 'hard',
    prompt: `A SaaS company has: ARR $480M growing 35% YoY, NRR 118%, Gross Margin 76%, S&M as % of revenue 52%, R&D 18%, G&A 9%. The company is raising a growth round at 12x ARR.

(1) What is the Rule of 40 score and what does it imply?
(2) At 12x ARR, what revenue multiple does this imply on a forward basis assuming growth holds?
(3) What is the single biggest risk to the valuation thesis?`,
    rubric: {
      correctness: '(1) Rule of 40 = 35% growth + (76-52-18-9)% FCF margin = 35 + (-3) = 32. Below 40, underperforming. (2) Forward ARR ~$648M, 12x trailing = ~8.9x forward revenue. (3) S&M inefficiency / CAC payback given 52% S&M burn.',
      reasoning: 'Should correctly compute operating margin components; should note 118% NRR is strong but insufficient to offset S&M burn; should connect S&M inefficiency to burn risk.',
      calibration: 'Should not call 12x expensive or cheap without reference to growth-adjusted comps (e.g., EV/NTM Revenue / growth rate).',
      precision: 'Should use Rule of 40 correctly; should distinguish ARR from revenue; should mention CAC efficiency or payback period.',
    },
    knownFailureModes: [
      'Arithmetic errors in Rule of 40 (forgetting to sum all opex lines)',
      'Not computing forward multiple (using trailing only)',
      'Identifying growth slowdown as primary risk rather than unit economics',
    ],
  },
]

/**
 * Prompt templates for preference pair generation.
 * Used in the RLHF Pairs tab.
 */
export const PREF_TEMPLATES = [
  'Analyze the investment thesis for a company with strong revenue growth but deteriorating margins.',
  'A company misses EPS estimates but raises full-year guidance. How should an investor interpret this?',
  'Compare two companies: one with 25% growth and 15% FCF margin vs one with 10% growth and 30% FCF margin. Which would you prefer at the same EV/Revenue multiple?',
  'A bond investor asks whether rising credit spreads in high-yield are a leading indicator for equities. What is the correct answer?',
  'Explain why a high current ratio might not indicate strong liquidity.',
]
