import { createClient } from '@/app/lib/supabase-server'
import UserList from './_components/user-list'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, role, deleted_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">ユーザー管理</h1>
        <UserList users={users || []} />
      </div>
    </div>
  )
}
