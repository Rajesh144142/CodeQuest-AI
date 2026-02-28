export type Language = 'cpp' | 'python'

export type GeneratedQuestion = {
  prompt: string
  options: string[]
  answer_index: number
  answer_text: string
  boilerplate_code: string
  explanation: string
  points: number
}

export type GenerateQuestionRequest = {
  language: Language
  step_number: number
  previous_answer_correct: boolean
}

export type GenerateQuestionResponse = {
  question: GeneratedQuestion
  stored: Record<string, unknown>
}
