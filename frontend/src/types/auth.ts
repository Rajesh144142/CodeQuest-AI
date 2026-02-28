export type AuthUser = {
  id: string
  email: string
  role: 'super_admin' | 'staff' | 'learner'
}

export type AuthResponse = {
  access_token: string
  token_type: string
  user: AuthUser
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = LoginPayload
