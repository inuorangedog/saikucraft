import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import HistoryClient from './_components/history-client'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  // クリエイターとしての取引（受注）
  const { data: creatorTx } = await supabase
    .from('transactions')
    .select(`
      id, status, amount, payment_status, created_at, deadline,
      delivered_at, stripe_payment_intent_id,
      client:profiles!transactions_client_id_fkey(username)
    `)
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  // 依頼者としての取引（発注）
  const { data: clientTx } = await supabase
    .from('transactions')
    .select(`
      id, status, amount, payment_status, created_at, deadline,
      delivered_at, stripe_payment_intent_id,
      creator:profiles!transactions_creator_id_fkey(username)
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  // BOOST送信
  const { data: boostsSent } = await supabase
    .from('boosts')
    .select('id, amount, created_at, transaction_id')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false })

  // BOOST受信
  const { data: boostsReceived } = await supabase
    .from('boosts')
    .select('id, amount, created_at, transaction_id')
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false })

  const isCreator = profile.user_type === 'creator' || profile.user_type === 'both'
  const isClient = profile.user_type === 'client' || profile.user_type === 'both'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          取引履歴・明細
        </h1>
        <HistoryClient
          isCreator={isCreator}
          isClient={isClient}
          creatorTransactions={(creatorTx || []).map(t => ({
            id: t.id,
            status: t.status,
            amount: t.amount,
            paymentStatus: t.payment_status,
            createdAt: t.created_at,
            deadline: t.deadline,
            deliveredAt: t.delivered_at,
            partnerName: (t.client as unknown as { username: string })?.username || '不明',
          }))}
          clientTransactions={(clientTx || []).map(t => ({
            id: t.id,
            status: t.status,
            amount: t.amount,
            paymentStatus: t.payment_status,
            createdAt: t.created_at,
            deadline: t.deadline,
            deliveredAt: t.delivered_at,
            partnerName: (t.creator as unknown as { username: string })?.username || '不明',
          }))}
          boostsSent={(boostsSent || []).map(b => ({
            id: b.id,
            amount: b.amount,
            createdAt: b.created_at,
            transactionId: b.transaction_id,
          }))}
          boostsReceived={(boostsReceived || []).map(b => ({
            id: b.id,
            amount: b.amount,
            createdAt: b.created_at,
            transactionId: b.transaction_id,
          }))}
        />
      </div>
    </div>
  )
}
