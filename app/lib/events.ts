'use server'

import { createClient } from '@/app/lib/supabase-server'

export async function getAllEvents() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id, name, date, location, is_permanent')
    .order('is_permanent', { ascending: false })
    .order('date', { ascending: true })
  return data || []
}

export async function getUpcomingEvents() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('events')
    .select('id, name, date, location, is_permanent')
    .or(`is_permanent.eq.true,date.gte.${today}`)
    .order('date', { ascending: true })
    .limit(10)
  return data || []
}

export async function getUserEvents(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_events')
    .select('event_id, events(id, name, date)')
    .eq('user_id', userId)

  return (data || []).map((d) => (d as unknown as { event_id: string; events: { id: string; name: string; date: string | null } }).events)
}

export async function updateUserEvents(eventIds: string[]): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // 既存を削除
  await supabase
    .from('user_events')
    .delete()
    .eq('user_id', user.id)

  // 新しく挿入
  if (eventIds.length > 0) {
    const { error } = await supabase
      .from('user_events')
      .insert(eventIds.map((eventId) => ({ user_id: user.id, event_id: eventId })))

    if (error) return { error: `更新に失敗しました: ${error.message}` }
  }

  return { success: true }
}
