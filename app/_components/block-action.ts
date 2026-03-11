'use server'

import { createClient } from '@/app/lib/supabase-server'

export async function toggleBlock(
  blockedId: string
): Promise<{ error: string } | { isBlocked: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です' }
  if (user.id === blockedId) return { error: '自分をブロックできません' }

  const { data: existing } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId)
    .single()

  if (existing) {
    await supabase.from('blocks').delete().eq('id', existing.id)
    return { isBlocked: false }
  } else {
    const { error } = await supabase
      .from('blocks')
      .insert({ blocker_id: user.id, blocked_id: blockedId })
    if (error) return { error: error.message }
    return { isBlocked: true }
  }
}

// ブロックされているか確認（サーバー側ユーティリティ）
export async function isBlockedBy(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .single()
  return !!data
}
