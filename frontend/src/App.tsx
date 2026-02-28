import { lazy, Suspense, useState } from 'react'
import { loginUser, registerUser } from './api/auth'
import { useAuthStore } from './store/useAuthStore'
import { useLearningStore } from './store/useCounterStore'

const CppTrack = lazy(() => import('./tracks/CppTrack'))
const PythonTrack = lazy(() => import('./tracks/PythonTrack'))

type AuthMode = 'login' | 'register'

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
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-md p-6 pt-16 md:p-10">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h1 className="text-3xl font-bold">CodeQuest</h1>
            <p className="mt-2 text-sm text-slate-300">Login to start generating coding questions.</p>

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
          </div>
        </div>
      </main>
    )
  }

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
