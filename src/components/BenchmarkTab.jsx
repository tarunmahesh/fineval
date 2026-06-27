import { useState } from 'react'
import { callClaude, parseJSON } from '../lib/claude.js'
import { QUESTIONS, CATEGORIES } from '../data/questions.js'

const SCORE_LABELS = ['correctness', 'reasoning', 'calibration', 'precision']

function scoreColor(s) {
  if (s >= 3) return 'text-emerald-400'
  if (s >= 2) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBg(s) {
  if (s >= 3) return 'bg-emerald-950 border-emerald-800'
  if (s >= 2) return 'bg-amber-950 border-amber-800'
  return 'bg-red-950 border-red-800'
}

function diffColor(d) {
  return d === 'hard' ? 'text-red-400 bg-red-950 border-red-800'
    : d === 'medium' ? 'text-amber-400 bg-amber-950 border-amber-800'
    : 'text-emerald-400 bg-emerald-950 border-emerald-800'
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

async function runQuestion(q) {
  // Step 1: get model answer
  const answer = await callClaude(
    'You are a senior equity research analyst and portfolio manager. Answer the following financial question clearly and precisely.',
    q.prompt
  )

  // Step 2: LLM-as-judge scoring
  const rubricStr = SCORE_LABELS.map(k => `${k}: ${q.rubric[k]}`).join('\n')
  const raw = await callClaude(
    `You are an expert evaluator scoring LLM responses to financial reasoning questions.
Score the response on four dimensions, each 0-3 (0=wrong/missing, 1=partial, 2=good, 3=excellent).
Also identify which failure modes from the known list were exhibited (if any).
Return ONLY valid JSON, no markdown.`,
    `Question: ${q.prompt}

Model answer: ${answer}

Rubric:
${rubricStr}

Known failure modes:
${q.knownFailureModes.map((f, i) => `${i}. ${f}`).join('\n')}

Return:
{
  "scores": { "correctness": 0, "reasoning": 0, "calibration": 0, "precision": 0 },
  "total": 0,
  "failure_modes_exhibited": [0],
  "judge_rationale": "one paragraph explaining the scores"
}`
  )

  const judgment = parseJSON(raw)
  return { answer, judgment }
}

export default function BenchmarkTab() {
  const [results, setResults] = useState({})
  const [running, setRunning] = useState({})
  const [runningAll, setRunningAll] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [categoryFilter, setCategoryFilter] = useState('All')

  const filtered = categoryFilter === 'All' ? QUESTIONS : QUESTIONS.filter(q => q.category === categoryFilter)

  const runOne = async (q) => {
    setRunning(r => ({ ...r, [q.id]: true }))
    try {
      const result = await runQuestion(q)
      setResults(r => ({ ...r, [q.id]: result }))
      setExpanded(e => ({ ...e, [q.id]: true }))
    } catch (e) {
      console.error(e)
    }
    setRunning(r => ({ ...r, [q.id]: false }))
  }

  const runAll = async () => {
    setRunningAll(true)
    for (const q of filtered) {
      if (!results[q.id]) await runOne(q)
    }
    setRunningAll(false)
  }

  const completedCount = Object.keys(results).length
  const avgTotal = completedCount > 0
    ? (Object.values(results).reduce((s, r) => s + (r.judgment.total || 0), 0) / completedCount).toFixed(1)
    : null

  const failureCounts = {}
  Object.entries(results).forEach(([id, r]) => {
    const q = QUESTIONS.find(q => q.id === id)
    if (!q) return
    ;(r.judgment.failure_modes_exhibited || []).forEach(i => {
      const label = q.knownFailureModes[i]
      if (label) failureCounts[label] = (failureCounts[label] || 0) + 1
    })
  })

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: question list */}
      <div className="flex flex-col w-full overflow-y-auto">
        {/* Controls */}
        <div className="sticky top-0 z-10 bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center gap-3 flex-wrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 outline-none"
          >
            <option>All</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <button
            onClick={runAll}
            disabled={runningAll}
            className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            {runningAll && <Spinner />}
            {runningAll ? 'Running...' : `Run all (${filtered.length})`}
          </button>

          {completedCount > 0 && (
            <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
              <span>{completedCount}/{QUESTIONS.length} completed</span>
              <span className={`font-semibold ${scoreColor(avgTotal / 3)}`}>avg {avgTotal}/12</span>
            </div>
          )}
        </div>

        {/* Aggregate failure mode summary */}
        {Object.keys(failureCounts).length > 0 && (
          <div className="mx-6 mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Failure mode frequency</p>
            <div className="space-y-2">
              {Object.entries(failureCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-1.5 bg-red-700 rounded-full" style={{ width: `${count * 40}px`, minWidth: 8 }} />
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs text-slate-600 ml-auto">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="px-6 py-4 space-y-3 max-w-4xl">
          {filtered.map(q => {
            const result = results[q.id]
            const isRunning = running[q.id]
            const isExpanded = expanded[q.id]

            return (
              <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                {/* Question header */}
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{q.category}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${diffColor(q.difficulty)}`}>{q.difficulty}</span>
                      {result && (
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${scoreBg(result.judgment.total / 4)}`}>
                          {result.judgment.total}/12
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{q.prompt}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 pb-3">
                  <button
                    onClick={() => runOne(q)}
                    disabled={isRunning}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {isRunning && <Spinner />}
                    {isRunning ? 'Running...' : result ? 'Re-run' : 'Run'}
                  </button>
                  {result && (
                    <button
                      onClick={() => setExpanded(e => ({ ...e, [q.id]: !e[q.id] }))}
                      className="px-3 py-1.5 rounded-lg text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {isExpanded ? 'Collapse' : 'View results'}
                    </button>
                  )}
                </div>

                {/* Expanded results */}
                {result && isExpanded && (
                  <div className="border-t border-slate-800 p-4 space-y-4">
                    {/* Score grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {SCORE_LABELS.map(k => (
                        <div key={k} className={`rounded-lg p-3 border ${scoreBg(result.judgment.scores[k])}`}>
                          <p className="text-xs text-slate-500 mb-1 capitalize">{k}</p>
                          <p className={`text-lg font-bold ${scoreColor(result.judgment.scores[k])}`}>
                            {result.judgment.scores[k]}/3
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Failure modes */}
                    {result.judgment.failure_modes_exhibited?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Failure modes exhibited</p>
                        <div className="space-y-1">
                          {result.judgment.failure_modes_exhibited.map(i => (
                            <div key={i} className="flex items-start gap-2 text-xs text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                              <span className="mt-0.5">!</span>
                              <span>{q.knownFailureModes[i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Judge rationale */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Judge rationale</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{result.judgment.judge_rationale}</p>
                    </div>

                    {/* Model answer */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Model answer</p>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-800/50 rounded-lg p-3">{result.answer}</p>
                    </div>

                    {/* Rubric */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Rubric</p>
                      <div className="space-y-1.5">
                        {SCORE_LABELS.map(k => (
                          <div key={k} className="text-xs text-slate-500 bg-slate-800/30 rounded-lg px-3 py-2">
                            <span className="text-slate-400 font-medium capitalize">{k}: </span>
                            {q.rubric[k]}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
