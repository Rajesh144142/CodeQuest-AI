import { create } from 'zustand'
import type { Language } from '../types/backend'

type LearningStore = {
  selectedLanguage: Language
  points: number
  attemptedQuestions: Record<string, boolean>
  correctQuestions: Record<string, boolean>
  setLanguage: (language: Language) => void
  submitAnswer: (questionKey: string, isCorrect: boolean, points: number) => void
  resetProgress: () => void
}

const initialState = {
  selectedLanguage: 'cpp' as Language,
  points: 0,
  attemptedQuestions: {} as Record<string, boolean>,
  correctQuestions: {} as Record<string, boolean>,
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  ...initialState,
  setLanguage: (language) => set({ selectedLanguage: language }),
  submitAnswer: (questionKey, isCorrect, points) => {
    const isFirstAttempt = !get().attemptedQuestions[questionKey]
    if (!isFirstAttempt) {
      return
    }

    set((state) => ({
      attemptedQuestions: {
        ...state.attemptedQuestions,
        [questionKey]: true,
      },
      correctQuestions: {
        ...state.correctQuestions,
        [questionKey]: isCorrect,
      },
      points: isCorrect ? state.points + points : state.points,
    }))
  },
  resetProgress: () => set(initialState),
}))
