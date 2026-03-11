'use server'

import { createClient } from '@/app/lib/supabase-server'

export type ListingInput = {
  title: string
  description: string
  budget: number | null
  headcount: number
  deadline: string
  applicationDeadline: string
  eventId?: string | null
}

export async function createListing(data: ListingInput): Promise<{ error: string } | { success: true; id: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  if (!data.title.trim()) return { error: 'タイトルを入力してください' }

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      client_id: user.id,
      title: data.title.trim(),
      description: data.description.trim() || null,
      budget: data.budget,
      headcount: data.headcount || 1,
      deadline: data.deadline || null,
      application_deadline: data.applicationDeadline || null,
      event_id: data.eventId || null,
    })
    .select('id')
    .single()

  if (error) return { error: `作成に失敗しました: ${error.message}` }
  return { success: true, id: listing.id }
}

export async function updateListing(
  id: string,
  data: Partial<ListingInput> & { status?: string }
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const payload: Record<string, unknown> = {}
  if (data.title !== undefined) payload.title = data.title.trim()
  if (data.description !== undefined) payload.description = data.description.trim() || null
  if (data.budget !== undefined) payload.budget = data.budget
  if (data.headcount !== undefined) payload.headcount = data.headcount
  if (data.deadline !== undefined) payload.deadline = data.deadline || null
  if (data.applicationDeadline !== undefined) payload.application_deadline = data.applicationDeadline || null
  if (data.eventId !== undefined) payload.event_id = data.eventId || null
  if (data.status !== undefined) payload.status = data.status

  const { error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', id)
    .eq('client_id', user.id)

  if (error) return { error: `更新に失敗しました: ${error.message}` }
  return { success: true }
}

export async function deleteListing(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // 進行中の取引がある場合は削除不可
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', id)
    .not('status', 'in', '("完了","キャンセル")')
  if (count && count > 0) return { error: '進行中の取引がある募集は削除できません' }

  // 関連データを削除
  await supabase.from('listing_tags').delete().eq('listing_id', id)
  await supabase.from('listing_specialties').delete().eq('listing_id', id)
  await supabase.from('listing_applications').delete().eq('listing_id', id)

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('client_id', user.id)

  if (error) return { error: `削除に失敗しました: ${error.message}` }
  return { success: true }
}
