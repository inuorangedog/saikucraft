'use server'

import { createClient } from '@/app/lib/supabase-server'

async function getCreatorId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return cp?.id ?? null
}

export async function addPriceMenu(data: {
  label: string
  price: number | null
  priceNote: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const creatorId = await getCreatorId()
  if (!creatorId) return { error: 'クリエイタープロフィールが見つかりません' }

  // 上限チェック（最大10件）
  const { count } = await supabase
    .from('price_menus')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
  if ((count ?? 0) >= 10) return { error: '料金メニューは最大10件までです' }

  // 最大sort_order取得
  const { data: maxItem } = await supabase
    .from('price_menus')
    .select('sort_order')
    .eq('creator_id', creatorId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxItem?.sort_order ?? -1) + 1

  const { error } = await supabase.from('price_menus').insert({
    creator_id: creatorId,
    label: data.label.trim(),
    price: data.price,
    price_note: data.priceNote.trim() || null,
    sort_order: nextOrder,
  })

  if (error) return { error: `追加に失敗しました: ${error.message}` }
  return { success: true }
}

export async function updatePriceMenu(
  id: string,
  data: { label: string; price: number | null; priceNote: string }
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const creatorId = await getCreatorId()
  if (!creatorId) return { error: 'クリエイタープロフィールが見つかりません' }

  const { error } = await supabase
    .from('price_menus')
    .update({
      label: data.label.trim(),
      price: data.price,
      price_note: data.priceNote.trim() || null,
    })
    .eq('id', id)
    .eq('creator_id', creatorId)

  if (error) return { error: `更新に失敗しました: ${error.message}` }
  return { success: true }
}

export async function deletePriceMenu(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const creatorId = await getCreatorId()
  if (!creatorId) return { error: 'クリエイタープロフィールが見つかりません' }

  const { error } = await supabase
    .from('price_menus')
    .delete()
    .eq('id', id)
    .eq('creator_id', creatorId)

  if (error) return { error: `削除に失敗しました: ${error.message}` }
  return { success: true }
}

export async function reorderPriceMenus(
  orderedIds: string[]
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const creatorId = await getCreatorId()
  if (!creatorId) return { error: 'クリエイタープロフィールが見つかりません' }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('price_menus')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('creator_id', creatorId)

    if (error) return { error: `並び替えに失敗しました: ${error.message}` }
  }

  return { success: true }
}
