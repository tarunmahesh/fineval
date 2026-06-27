console.log(import.meta.env)

import { useState } from 'react'
import BenchmarkTab from './components/BenchmarkTab.jsx'
import PreferencePairsTab from './components/PreferencePairsTab.jsx'

const TABS = [
  { id: 'benchmark', label: 'Benchmark runner' },
  { id: 'pairs', label: 'RLHF pair generator' },
]

export default function App() {
  const [tab, setTab] = useState('benchmark')

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-100">FinEval</span>
          <span className="text-xs text-slate-600 ml-2">Financial reasoning benchmark + RLHF pair generator</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-6 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'benchmark' && <BenchmarkTab />}
        {tab === 'pairs' && <PreferencePairsTab />}
      </div>
    </div>
  )
}
