import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminActivity, fetchAdminStats, fetchAdminUsers } from '../api/admin'

export function AdminPanel() {
  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchAdminStats })
  const usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: fetchAdminUsers })
  const activityQuery = useQuery({ queryKey: ['admin', 'activity'], queryFn: fetchAdminActivity })
  const users = usersQuery.data ?? []
  const activity = activityQuery.data ?? []
  const topGenerators = useMemo(
    () => [...users].sort((a, b) => b.generated_question_count - a.generated_question_count).slice(0, 8),
    [users],
  )
  const maxGenerated = Math.max(...topGenerators.map((u) => u.generated_question_count), 1)

  if (statsQuery.isLoading || usersQuery.isLoading || activityQuery.isLoading) {
    return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">Loading admin panel...</div>
  }

  if (statsQuery.isError || usersQuery.isError || activityQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200">
        Failed to load admin data. Ensure your account is `super_admin`.
      </div>
    )
  }

  const stats = statsQuery.data!

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Total Users" value={stats.total_users} />
        <MetricCard title="Questions Generated" value={stats.total_questions_generated} />
        <MetricCard title="Logins Today" value={stats.logins_today} />
        <MetricCard title="Super Admins" value={stats.total_super_admin} />
        <MetricCard title="Staff" value={stats.total_staff} />
        <MetricCard title="Learners" value={stats.total_learners} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-lg font-semibold">Top Generators</h3>
        <p className="mt-1 text-sm text-slate-400">Users ranked by generated questions.</p>
        <div className="mt-4 space-y-3">
          {topGenerators.map((user) => {
            const width = Math.max(6, Math.round((user.generated_question_count / maxGenerated) * 100))
            return (
              <div key={user.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate text-slate-200">{user.email}</span>
                  <span className="text-slate-300">{user.generated_question_count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-lg font-semibold">Users</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Generated</th>
                <th className="pb-2">Logins</th>
                <th className="pb-2">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-800">
                  <td className="py-3">{user.email}</td>
                  <td className="py-3 capitalize">{user.role.replace('_', ' ')}</td>
                  <td className="py-3">{user.generated_question_count}</td>
                  <td className="py-3">{user.login_count}</td>
                  <td className="py-3 text-slate-300">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-lg font-semibold">Recent Auth Activity</h3>
        <div className="mt-3 space-y-2">
          {activity.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
          {activity.map((item, index) => (
            <div key={`${item.user_id}-${item.occurred_at}-${index}`} className="rounded-lg bg-slate-950/60 p-3">
              <p className="text-sm text-slate-200">
                {item.email ?? 'Unknown user'} performed <span className="text-emerald-300">{item.event_type}</span>
              </p>
              <p className="text-xs text-slate-400">{new Date(item.occurred_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
