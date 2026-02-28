export type Language = 'cpp' | 'python'

export type Question = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
  points: number
}

export type LessonStep = {
  id: string
  title: string
  explanation: string
  boilerplate: string
  question: Question
}

export type Track = {
  language: Language
  label: string
  intro: string
  steps: LessonStep[]
}

export type LessonsResponse = {
  tracks: Track[]
}
