import { lazy, Suspense } from 'react'
import { useLearningStore } from './store/useCounterStore'

const CppTrack = lazy(() => import('./tracks/CppTrack'))
const PythonTrack = lazy(() => import('./tracks/PythonTrack'))

function AppContent() {
  const selectedLanguage = useLearningStore((state) => state.selectedLanguage)
  const setLanguage = useLearningStore((state) => state.setLanguage)
  const points = useLearningStore((state) => state.points)
  const resetProgress = useLearningStore((state) => state.resetProgress)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div>
            <h1 className="text-3xl font-bold">CodeQuest</h1>
            <p className="mt-1 text-sm text-slate-300">
              Learn step by step with boilerplate + quiz points.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300">
              Points: {points}
            </span>
            <button
              onClick={resetProgress}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Reset Progress
            </button>
          </div>
        </header>

        <section className="flex gap-3">
          <button
            onClick={() => setLanguage('cpp')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              selectedLanguage === 'cpp'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            C++ Track
          </button>
          <button
            onClick={() => setLanguage('python')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              selectedLanguage === 'python'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Python Track
          </button>
        </section>

        <Suspense fallback={<div className="rounded-xl bg-slate-900 p-5 text-slate-300">Loading track...</div>}>
          {selectedLanguage === 'cpp' ? <CppTrack /> : <PythonTrack />}
        </Suspense>
      </div>
    </main>
  )
}

export default function App() {
  return <AppContent />
}
