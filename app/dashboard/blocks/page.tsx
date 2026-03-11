import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import BlockList from './_components/block-list'

export const metadata = {
  title: 'ブロックリスト',
}

export default async function BlocksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blocks } = await supabase
    .from('blocks')
    .select('id, blocked_id, created_at')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false })

  // ブロック対象のプロフィールを取得
  const blockedIds = (blocks || []).map((b) => b.blocked_id)
  let profiles: Record<string, { username: string; avatar_url: string | null }> = {}

  if (blockedIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', blockedIds)

    for (const p of profileData || []) {
      profiles[p.user_id] = { username: p.username, avatar_url: p.avatar_url }
    }
  }

  const items = (blocks || []).map((b) => ({
    id: b.id,
    blockedId: b.blocked_id,
    username: profiles[b.blocked_id]?.username || '退会済みユーザー',
    avatarUrl: profiles[b.blocked_id]?.avatar_url || null,
    createdAt: b.created_at,
  }))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">ブロックリスト</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ブロック中のユーザーを管理できます
        </p>
        <BlockList initialItems={items} />
      </div>
    </div>
  )
}
