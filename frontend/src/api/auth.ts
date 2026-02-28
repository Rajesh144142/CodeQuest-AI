import { http } from './http'
import type { AuthResponse, LoginPayload, RegisterPayload } from '../types/auth'

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await http.post<AuthResponse>('/api/v1/auth/register', payload)
  return data
}

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await http.post<AuthResponse>('/api/v1/auth/login', payload)
  return data
}
