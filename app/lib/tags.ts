'use server'

import { createClient } from '@/app/lib/supabase-server'

export async function getAllTags() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tags')
    .select('id, name, category')
    .order('category')
    .order('name')
  return data || []
}

export async function getCreatorTags(userId: string) {
  const supabase = await createClient()

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!cp) return []

  const { data } = await supabase
    .from('creator_tags')
    .select('tag_id, tags(id, name, category)')
    .eq('creator_id', cp.id)

  return (data || []).map((d) => (d as unknown as { tag_id: string; tags: { id: string; name: string; category: string } }).tags)
}

export async function updateCreatorTags(tagIds: string[]): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  if (tagIds.length > 10) return { error: 'タグは最大10個までです' }

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cp) return { error: 'クリエイタープロフィールが見つかりません' }

  // 既存のタグを削除
  await supabase
    .from('creator_tags')
    .delete()
    .eq('creator_id', cp.id)

  // 新しいタグを挿入
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from('creator_tags')
      .insert(tagIds.map((tagId) => ({ creator_id: cp.id, tag_id: tagId })))

    if (error) return { error: `タグの更新に失敗しました: ${error.message}` }
  }

  return { success: true }
}

export async function getListingTags(listingId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listing_tags')
    .select('tag_id, tags(id, name, category)')
    .eq('listing_id', listingId)

  return (data || []).map((d) => (d as unknown as { tag_id: string; tags: { id: string; name: string; category: string } }).tags)
}

export async function getListingTagIds(listingId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listing_tags')
    .select('tag_id')
    .eq('listing_id', listingId)
  return (data || []).map((d) => d.tag_id)
}

export async function updateListingTags(listingId: string, tagIds: string[]): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // 既存のタグを削除
  await supabase
    .from('listing_tags')
    .delete()
    .eq('listing_id', listingId)

  // 新しいタグを挿入
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from('listing_tags')
      .insert(tagIds.map((tagId) => ({ listing_id: listingId, tag_id: tagId })))

    if (error) return { error: `タグの更新に失敗しました: ${error.message}` }
  }

  return { success: true }
}
