import { createClient } from '@/app/lib/supabase-server'
import Link from 'next/link'
import DisputeList from './_components/dispute-list'

export default async function AdminDisputesPage() {
  const supabase = await createClient()

  const { data: disputes } = await supabase
    .from('transactions')
    .select(`
      id,
      status,
      amount,
      created_at,
      deadline,
      payment_status,
      creator_id,
      client_id
    `)
    .eq('status', '異議申し立て中')
    .order('created_at', { ascending: false })

  // 関連ユーザー名を取得
  const userIds = new Set<string>()
  ;(disputes || []).forEach((d) => {
    userIds.add(d.creator_id)
    userIds.add(d.client_id)
  })

  const { data: profiles } = userIds.size > 0
    ? await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', [...userIds])
    : { data: [] }

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.username]))

  const enriched = (disputes || []).map((d) => ({
    ...d,
    creator_name: profileMap.get(d.creator_id) || '不明',
    client_name: profileMap.get(d.client_id) || '不明',
  }))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">異議申し立て管理</h1>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            管理画面に戻る
          </Link>
        </div>

        {enriched.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            現在、異議申し立て中の取引はありません。
          </p>
        ) : (
          <DisputeList disputes={enriched} />
        )}
      </div>
    </div>
  )
}
