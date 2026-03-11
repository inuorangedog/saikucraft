'use server'

import { createClient } from '@/app/lib/supabase-server'

export type Specialty = {
  id: string
  category: string
  name: string
  description: string | null
  sort_order: number
}

export type GroupedSpecialties = {
  category: string
  specialties: Specialty[]
}

export async function getAllSpecialties(): Promise<GroupedSpecialties[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('specialties')
    .select('id, category, name, description, sort_order')
    .order('sort_order', { ascending: true })

  const items = data || []

  const categoryMap = new Map<string, Specialty[]>()
  for (const item of items) {
    const list = categoryMap.get(item.category) || []
    list.push(item)
    categoryMap.set(item.category, list)
  }

  const groups: GroupedSpecialties[] = []
  for (const [category, specialties] of categoryMap) {
    groups.push({ category, specialties })
  }

  return groups
}

export async function updateCreatorSpecialties(specialtyIds: string[]): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cp) return { error: 'クリエイタープロフィールが見つかりません' }

  await supabase.from('creator_specialties').delete().eq('creator_id', cp.id)

  if (specialtyIds.length > 0) {
    const { error } = await supabase
      .from('creator_specialties')
      .insert(specialtyIds.map((sid) => ({ creator_id: cp.id, specialty_id: sid })))
    if (error) return { error: `職種の更新に失敗しました: ${error.message}` }
  }

  return { success: true }
}

export async function getListingSpecialtyIds(listingId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listing_specialties')
    .select('specialty_id')
    .eq('listing_id', listingId)
  return (data || []).map((d) => d.specialty_id)
}

export async function updateListingSpecialties(listingId: string, specialtyIds: string[]): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  await supabase.from('listing_specialties').delete().eq('listing_id', listingId)

  if (specialtyIds.length > 0) {
    const { error } = await supabase
      .from('listing_specialties')
      .insert(specialtyIds.map((sid) => ({ listing_id: listingId, specialty_id: sid })))
    if (error) return { error: `職種の更新に失敗しました: ${error.message}` }
  }

  return { success: true }
}

export async function getCreatorSpecialtyIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!cp) return []

  const { data } = await supabase
    .from('creator_specialties')
    .select('specialty_id')
    .eq('creator_id', cp.id)

  return (data || []).map((d) => d.specialty_id)
}
