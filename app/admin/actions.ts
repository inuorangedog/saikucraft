'use server'

import { createClient } from '@/app/lib/supabase-server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('認証されていません')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('管理者権限がありません')
  return supabase
}

// 通報ステータス更新
export async function updateReportStatus(
  reportId: string,
  status: 'reviewing' | 'resolved'
): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)
    if (error) return { error: error.message }
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// アカウント停止（論理削除）
export async function suspendUser(
  userId: string
): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
    if (error) return { error: error.message }
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// アカウント復旧
export async function restoreUser(
  userId: string
): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: null })
      .eq('user_id', userId)
    if (error) return { error: error.message }
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// イベント作成
export async function createEvent(data: {
  name: string
  date: string
  location: string
  scale: string
  isPermanent: boolean
}): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase
      .from('events')
      .insert({
        name: data.name,
        date: data.date || null,
        location: data.location || null,
        scale: data.scale || null,
        is_permanent: data.isPermanent,
      })
    if (error) return { error: error.message }
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// イベント削除
export async function deleteEvent(
  eventId: string
): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
    if (error) return { error: error.message }
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
