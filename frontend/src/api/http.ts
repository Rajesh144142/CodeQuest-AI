import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
})

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem('codequest_auth')
  if (!raw) {
    return config
  }

  try {
    const parsed = JSON.parse(raw) as { token?: string }
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`
    }
  } catch {
    return config
  }

  return config
})
