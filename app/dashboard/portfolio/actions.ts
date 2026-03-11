'use server'

import { createClient } from '@/app/lib/supabase-server'

export async function addPortfolio(data: {
  title: string
  description: string
  imageUrl: string
  tags: string[]
  isR18: boolean
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cp) return { error: 'クリエイタープロフィールが見つかりません' }

  // 上限チェック（最大5枚）
  const { count } = await supabase
    .from('portfolios')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if ((count ?? 0) >= 5) return { error: '作品は最大5枚まで登録できます' }

  // 現在の最大sort_orderを取得
  const { data: maxItem } = await supabase
    .from('portfolios')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxItem?.sort_order ?? -1) + 1

  const { error } = await supabase.from('portfolios').insert({
    creator_id: cp.id,
    user_id: user.id,
    title: data.title.trim(),
    description: data.description.trim() || null,
    image_url: data.imageUrl,
    tags: data.tags,
    is_r18: data.isR18,
    sort_order: nextOrder,
  })

  if (error) return { error: `追加に失敗しました: ${error.message}` }
  return { success: true }
}

export async function updatePortfolio(
  id: string,
  data: {
    title: string
    description: string
    tags: string[]
    isR18: boolean
  }
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { error } = await supabase
    .from('portfolios')
    .update({
      title: data.title.trim(),
      description: data.description.trim() || null,
      tags: data.tags,
      is_r18: data.isR18,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: `更新に失敗しました: ${error.message}` }
  return { success: true }
}

export async function deletePortfolio(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: `削除に失敗しました: ${error.message}` }
  return { success: true }
}

export async function reorderPortfolios(
  orderedIds: string[]
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('portfolios')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('user_id', user.id)

    if (error) return { error: `並び替えに失敗しました: ${error.message}` }
  }

  return { success: true }
}
