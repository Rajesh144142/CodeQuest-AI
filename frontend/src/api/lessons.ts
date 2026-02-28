import { http } from './http'
import type { LessonsResponse } from '../types/lesson'

export const fetchLessons = async (): Promise<LessonsResponse> => {
  const { data } = await http.get<LessonsResponse>('lessons.json')
  return data
}
