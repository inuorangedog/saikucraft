import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import NegotiationClient from './_components/negotiation-client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function NegotiationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: neg } = await supabase
    .from('negotiations')
    .select('id, creator_id, client_id, title, description, budget, deadline, status, created_at')
    .eq('id', id)
    .single()

  if (!neg) notFound()
  if (neg.creator_id !== user.id && neg.client_id !== user.id) notFound()

  // ユーザー名を取得
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username')
    .in('user_id', [neg.creator_id, neg.client_id])

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.username]))

  // 交渉メッセージを取得
  const { data: messages } = await supabase
    .from('negotiation_messages')
    .select('id, sender_id, message, proposed_budget, proposed_deadline, created_at')
    .eq('negotiation_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NegotiationClient
        negotiation={neg}
        messages={messages || []}
        currentUserId={user.id}
        creatorName={profileMap.get(neg.creator_id) || '不明'}
        clientName={profileMap.get(neg.client_id) || '不明'}
      />
    </div>
  )
}
