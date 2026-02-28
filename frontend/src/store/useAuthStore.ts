import { create } from 'zustand'
import type { AuthUser } from '../types/auth'

type AuthState = {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

const STORAGE_KEY = 'codequest_auth'

const getInitialAuth = (): { token: string | null; user: AuthUser | null } => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { token: null, user: null }
  }
  try {
    const parsed = JSON.parse(raw) as { token: string; user: AuthUser }
    return { token: parsed.token, user: parsed.user }
  } catch {
    return { token: null, user: null }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialAuth(),
  setAuth: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null })
  },
}))
