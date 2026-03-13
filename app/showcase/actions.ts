'use server'

import { createClient } from '@/app/lib/supabase-server'

export type ShowcaseItem = {
  id: string
  transaction_id: string
  creator_id: string
  media_url: string
  media_type: 'image' | 'video' | 'audio'
  caption: string | null
  created_at: string
  creator_username: string
  creator_avatar_url: string | null
}

export async function createShowcase(data: {
  transactionId: string
  mediaUrl: string
  mediaType: 'image' | 'video' | 'audio'
  caption?: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // 取引の確認
  const { data: tx } = await supabase
    .from('transactions')
    .select('id, creator_id, status, allow_showcase')
    .eq('id', data.transactionId)
    .single()

  if (!tx) return { error: '取引が見つかりません' }
  if (tx.creator_id !== user.id) return { error: 'クリエイターのみが投稿できます' }
  if (tx.status !== '完了') return { error: '完了した取引のみ投稿できます' }
  if (!tx.allow_showcase) return { error: '依頼者がショーケース掲載を許可していません' }

  // 既に投稿済みか確認
  const { data: existing } = await supabase
    .from('showcases')
    .select('id')
    .eq('transaction_id', data.transactionId)
    .single()

  if (existing) return { error: 'この取引のショーケースは既に投稿済みです' }

  const { error } = await supabase.from('showcases').insert({
    transaction_id: data.transactionId,
    creator_id: user.id,
    media_url: data.mediaUrl,
    media_type: data.mediaType,
    caption: data.caption?.trim() || null,
  })

  if (error) return { error: `投稿に失敗しました: ${error.message}` }
  return { success: true }
}

export async function deleteShowcase(showcaseId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { error } = await supabase
    .from('showcases')
    .delete()
    .eq('id', showcaseId)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getShowcases(limit = 12): Promise<ShowcaseItem[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('showcases')
    .select('id, transaction_id, creator_id, media_url, media_type, caption, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data || data.length === 0) return []

  const creatorIds = [...new Set(data.map((s) => s.creator_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url')
    .in('user_id', creatorIds)
    .is('deleted_at', null)

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]))

  return data.map((s) => {
    const p = profileMap.get(s.creator_id)
    return {
      ...s,
      creator_username: p?.username || '不明',
      creator_avatar_url: p?.avatar_url || null,
    }
  })
}
