import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import Link from 'next/link'

export default async function NegotiationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: negotiations } = await supabase
    .from('negotiations')
    .select('id, creator_id, client_id, title, budget, status, created_at')
    .or(`creator_id.eq.${user.id},client_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // ユーザー名を取得
  const userIds = [...new Set((negotiations || []).flatMap((n) => [n.creator_id, n.client_id]))]
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('user_id, username').in('user_id', userIds)
    : { data: [] }
  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.username]))

  const STATUS_COLORS: Record<string, string> = {
    '交渉中': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    '合意済み': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    '辞退': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    'キャンセル': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">交渉一覧</h1>

        <div className="mt-6 space-y-3">
          {(!negotiations || negotiations.length === 0) && (
            <p className="py-12 text-center text-sm text-zinc-400">交渉はまだありません</p>
          )}
          {(negotiations || []).map((neg) => {
            const isCreator = neg.creator_id === user.id
            const otherName = profileMap.get(isCreator ? neg.client_id : neg.creator_id) || '不明'
            return (
              <Link
                key={neg.id}
                href={`/negotiations/${neg.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{neg.title}</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {isCreator ? `依頼者: ${otherName}` : `クリエイター: ${otherName}`}
                      {neg.budget && ` ・ ¥${neg.budget.toLocaleString()}`}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {new Date(neg.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[neg.status] || ''}`}>
                    {neg.status}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
