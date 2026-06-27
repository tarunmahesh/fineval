import { useState } from 'react'
import { callClaude, parseJSON } from '../lib/claude.js'
import { PREF_TEMPLATES } from '../data/questions.js'

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function exportJSONL(pairs) {
  const lines = pairs.map(p => JSON.stringify({
    prompt: p.prompt,
    chosen: p.chosen,
    rejected: p.rejected,
    rubric: p.rubric,
    failure_mode: p.failureMode,
    category: p.category,
  }))
  const blob = new Blob([lines.join('\n')], { type: 'application/jsonl' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fineval_preference_pairs.jsonl'
  a.click()
  URL.revokeObjectURL(url)
}

async function generatePair(prompt) {
  const raw = await callClaude(
    `You are a senior financial analyst and RLHF data designer.
Given a financial question, generate a preference pair: one high-quality chosen response and one subtly flawed rejected response.
The rejected response should be wrong in a realistic, non-obvious way that an LLM might actually produce.
Also write a rubric that explains why chosen is better, and name the failure mode in the rejected response.
Return ONLY valid JSON, no markdown.`,
    `Question: "${prompt}"

Return:
{
  "chosen": "the high-quality, correct response",
  "rejected": "the subtly flawed response that looks plausible but contains a meaningful error",
  "rubric": "2-3 sentences explaining what makes chosen better and rejected worse",
  "failure_mode": "short label for the error type in rejected (e.g. 'Overconfident on incomplete data', 'Arithmetic error in ratio', 'Ignored base rate')",
  "category": "one of: Earnings Analysis | Ratio Interpretation | Macro vs. Micro Conflict | Sentiment vs. Fundamentals | Multi-step Reasoning | Other"
}`
  )
  return parseJSON(raw)
}

export default function PreferencePairsTab() {
  const [prompt, setPrompt] = useState('')
  const [pairs, setPairs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const pair = await generatePair(prompt.trim())
      setPairs(prev => [{ prompt: prompt.trim(), ...pair, id: Date.now() }, ...prev])
      setPrompt('')
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <div className="space-y-1.5">
          <p className="text-sm text-slate-400 leading-relaxed">
            Generate preference pairs for RLHF training. Each pair contains a chosen (correct) and rejected (plausibly flawed) response, with an explicit rubric and failure mode label. Export as JSONL for direct use in training pipelines.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter a financial reasoning question, or pick a template below..."
            rows={3}
            className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-600 resize-none transition-colors"
          />

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? 'Generating...' : 'Generate pair'}
            </button>

            {pairs.length > 0 && (
              <button
                onClick={() => exportJSONL(pairs)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export {pairs.length} pair{pairs.length > 1 ? 's' : ''} as JSONL
              </button>
            )}
          </div>

          {/* Templates */}
          <div className="flex gap-2 flex-wrap">
            {PREF_TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => setPrompt(t)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-left"
              >
                {t.slice(0, 55)}...
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Pairs */}
        {pairs.map(pair => (
          <div key={pair.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Prompt + metadata */}
            <div className="px-5 py-4 border-b border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{pair.category}</span>
                <span className="text-xs text-red-400 bg-red-950 border border-red-900 px-2 py-0.5 rounded-full ml-auto">
                  {pair.failureMode || pair.failure_mode}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{pair.prompt}</p>
            </div>

            {/* Chosen vs Rejected */}
            <div className="grid grid-cols-2 divide-x divide-slate-800">
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Chosen</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{pair.chosen}</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">Rejected</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{pair.rejected}</p>
              </div>
            </div>

            {/* Rubric */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-800/30">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Rubric</p>
              <p className="text-xs text-slate-400 leading-relaxed">{pair.rubric}</p>
            </div>
          </div>
        ))}

        {pairs.length === 0 && !loading && (
          <p className="text-sm text-slate-600 text-center py-16">
            Generate a pair to get started, or pick a template above.
          </p>
        )}
      </div>
    </div>
  )
}
