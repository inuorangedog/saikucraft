'use server'

import { createClient } from '@/app/lib/supabase-server'

export async function toggleFavorite(
  creatorId: string
): Promise<{ error: string } | { isFavorited: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です' }
  if (user.id === creatorId) return { error: '自分をお気に入りに追加できません' }

  // 既にお気に入りか確認
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .single()

  if (existing) {
    // 解除
    await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
    return { isFavorited: false }
  } else {
    // 追加
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, creator_id: creatorId })
    if (error) return { error: error.message }
    return { isFavorited: true }
  }
}
