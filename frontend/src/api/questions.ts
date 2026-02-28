import { http } from './http'
import type { GenerateQuestionRequest, GenerateQuestionResponse } from '../types/backend'

export const generateQuestion = async (
  payload: GenerateQuestionRequest,
): Promise<GenerateQuestionResponse> => {
  const { data } = await http.post<GenerateQuestionResponse>('/api/v1/questions/generate', payload)
  return data
}
