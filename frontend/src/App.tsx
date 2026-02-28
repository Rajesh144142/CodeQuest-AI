import { lazy, Suspense, useState } from 'react'
import { AdminPanel } from './components/AdminPanel'
import { loginUser, registerUser } from './api/auth'
import { useAuthStore } from './store/useAuthStore'
import { useLearningStore } from './store/useCounterStore'

const CppTrack = lazy(() => import('./tracks/CppTrack'))
const PythonTrack = lazy(() => import('./tracks/PythonTrack'))

type AuthMode = 'login' | 'register'
type AppTab = 'learn' | 'admin'

function AppContent() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const logout = useAuthStore((state) => state.logout)

  const selectedLanguage = useLearningStore((state) => state.selectedLanguage)
  const setLanguage = useLearningStore((state) => state.setLanguage)
  const points = useLearningStore((state) => state.points)
  const resetProgress = useLearningStore((state) => state.resetProgress)

  const [mode, setMode] = useState<AuthMode>('login')
  const [tab, setTab] = useState<AppTab>('learn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const handleAuthSubmit = async () => {
    try {
      setAuthError(null)
      setAuthLoading(true)
      const response =
        mode === 'login'
          ? await loginUser({ email, password })
          : await registerUser({ email, password })
      setAuth(response.access_token, response.user)
      setEmail('')
      setPassword('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  if (!token || !user) {
    return (
      <main className="flex min-h-screen items-center bg-[radial-gradient(circle_at_10%_10%,_#0f172a,_#020617_60%)] text-slate-100">
        <div className="mx-auto grid w-full max-w-6xl gap-8 p-6 md:grid-cols-2 md:p-10">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-4">
              <img src="/codequest.svg" alt="CodeQuest" className="h-14 w-14 rounded-xl" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight">CodeQuest AI</h1>
                <p className="text-sm text-slate-300">Adaptive coding learning platform</p>
              </div>
            </div>
            <p className="mt-6 text-slate-300">
              Learn C++ and Python step by step with generated coding problems, point-based progression, and
              analytics.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <InfoCard title="Adaptive Difficulty" subtitle="Harder after correct answers" />
              <InfoCard title="Daily Targets" subtitle="Track activity with limits" />
              <InfoCard title="Role-Based Access" subtitle="Super admin dashboard" />
              <InfoCard title="Live Generation" subtitle="Fresh questions every step" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
            <h2 className="text-2xl font-semibold">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-300">Sign in to continue your learning journey.</p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setMode('login')}
                className={`rounded-md px-3 py-2 text-sm ${
                  mode === 'login' ? 'bg-sky-600 text-white' : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('register')}
                className={`rounded-md px-3 py-2 text-sm ${
                  mode === 'register' ? 'bg-sky-600 text-white' : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                Register
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
              {authError && <p className="text-sm text-rose-300">{authError}</p>}
              <button
                onClick={handleAuthSubmit}
                disabled={authLoading || !email || !password}
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authLoading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a,_#020617_60%)] text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-2xl shadow-black/30">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CodeQuest</h1>
            <p className="mt-1 text-sm text-slate-300">
              Adaptive coding platform with role-based analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300">
              Points: {points}
            </span>
            <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">{user.email}</span>
            <button
              onClick={resetProgress}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Reset Progress
            </button>
            <button
              onClick={logout}
              className="rounded-md border border-rose-600/50 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/20"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="flex flex-wrap gap-3">
          <button
            onClick={() => setTab('learn')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === 'learn' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Learning
          </button>
          {user.role === 'super_admin' && (
            <button
              onClick={() => setTab('admin')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                tab === 'admin' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              Admin Panel
            </button>
          )}
        </section>

        {tab === 'learn' && (
          <>
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

            <Suspense
              fallback={<div className="rounded-xl bg-slate-900 p-5 text-slate-300">Loading track...</div>}
            >
              {selectedLanguage === 'cpp' ? <CppTrack /> : <PythonTrack />}
            </Suspense>
          </>
        )}

        {tab === 'admin' && user.role === 'super_admin' && <AdminPanel />}
        {tab === 'admin' && user.role !== 'super_admin' && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200">
            You do not have access to admin features.
          </div>
        )}
      </div>
    </main>
  )
}

export default function App() {
  return <AppContent />
}

function InfoCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="font-medium text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  )
}
