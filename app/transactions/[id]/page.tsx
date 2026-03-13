import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import TransactionClient from './_components/transaction-client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function TransactionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 取引を取得
  const { data: tx } = await supabase
    .from('transactions')
    .select('id, status, amount, deadline, revision_count, max_revisions, detailed_revision_count, max_detailed_revisions, final_revision_count, max_final_revisions, delivered_at, auto_approve_at, wants_copyright_transfer, wants_portfolio_ban, wants_commercial_use, delivery_file_url, delivery_file_name, allow_showcase, created_at, creator_id, client_id, payment_status, stripe_payment_intent_id, creator_agreed, client_agreed')
    .eq('id', id)
    .single()

  if (!tx) notFound()

  // 当事者チェック
  if (tx.creator_id !== user.id && tx.client_id !== user.id) {
    notFound()
  }

  // ユーザー名を取得
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username')
    .in('user_id', [tx.creator_id, tx.client_id])

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.username]))
  const creatorName = profileMap.get(tx.creator_id) || '不明'
  const clientName = profileMap.get(tx.client_id) || '不明'

  // クリエイターの修正ポリシーを取得
  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('revision_policy')
    .eq('user_id', tx.creator_id)
    .single()

  // BOOST状態を確認
  let alreadyBoosted = false
  if (tx.status === '完了' && tx.client_id === user.id) {
    const { data: boost } = await supabase
      .from('boosts')
      .select('id')
      .eq('transaction_id', id)
      .eq('sender_id', user.id)
      .single()
    alreadyBoosted = !!boost
  }

  // メッセージを取得
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, image_urls, created_at')
    .eq('transaction_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950">
      <TransactionClient
        transaction={tx}
        messages={messages || []}
        currentUserId={user.id}
        creatorName={creatorName}
        clientName={clientName}
        alreadyBoosted={alreadyBoosted}
        revisionPolicy={creatorProfile?.revision_policy || null}
      />
    </div>
  )
}
