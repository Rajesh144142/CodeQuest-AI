import { http } from './http'
import type { AdminActivity, AdminStats, AdminUser } from '../types/admin'

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const { data } = await http.get<AdminStats>('/api/v1/admin/stats')
  return data
}

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const { data } = await http.get<AdminUser[]>('/api/v1/admin/users')
  return data
}

export const fetchAdminActivity = async (): Promise<AdminActivity[]> => {
  const { data } = await http.get<AdminActivity[]>('/api/v1/admin/activity')
  return data
}
