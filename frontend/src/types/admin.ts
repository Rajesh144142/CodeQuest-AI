export type AdminStats = {
  total_users: number
  total_staff: number
  total_super_admin: number
  total_learners: number
  total_questions_generated: number
  logins_today: number
}

export type AdminUser = {
  id: string
  email: string
  role: 'super_admin' | 'staff' | 'learner'
  login_count: number
  generated_question_count: number
  last_login_at: string | null
  created_at: string | null
}

export type AdminActivity = {
  user_id: string | null
  email: string | null
  event_type: string
  occurred_at: string
}
