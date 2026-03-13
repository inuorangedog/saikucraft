'use server'

import { createClient } from '@/app/lib/supabase-server'
import { createNotification } from '@/app/lib/notifications'

export async function updateProfile(data: {
  username: string
  userType: 'client' | 'creator' | 'both'
  avatarUrl?: string
  bio?: string
  twitterUrl?: string
  pixivUrl?: string
  misskeyUrl?: string
  invoiceNumber?: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const updateData: Record<string, unknown> = {
    username: data.username.trim(),
    user_type: data.userType,
    bio: data.bio?.trim() || null,
    twitter_url: data.twitterUrl?.trim() || null,
    pixiv_url: data.pixivUrl?.trim() || null,
    misskey_url: data.misskeyUrl?.trim() || null,
    invoice_number: data.invoiceNumber?.trim() || null,
  }
  if (data.avatarUrl !== undefined) {
    updateData.avatar_url = data.avatarUrl
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', user.id)

  if (error) return { error: `更新に失敗しました: ${error.message}` }
  return { success: true }
}

export async function updateCreatorProfile(data: {
  bio: string
  status: '受付中' | '停止中'
  callOk: '不可' | '可' | '要相談'
  maxRevisions: number
  maxDetailedRevisions: number
  maxFinalRevisions: number
  revisionPolicy: string
  ngContent: string
  isR18Ok: boolean
  isCommercialOk: boolean
  isUrgentOk: boolean
  twitterUrl?: string
  pixivUrl?: string
  misskeyUrl?: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // 既存チェック
  const { data: existing } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const payload = {
    user_id: user.id,
    bio: data.bio || null,
    status: data.status,
    call_ok: data.callOk,
    max_revisions: data.maxRevisions,
    default_max_detailed_revisions: data.maxDetailedRevisions,
    default_max_final_revisions: data.maxFinalRevisions,
    revision_policy: data.revisionPolicy?.trim() || null,
    ng_content: data.ngContent || null,
    is_r18_ok: data.isR18Ok,
    is_commercial_ok: data.isCommercialOk,
    is_urgent_ok: data.isUrgentOk,
    twitter_url: data.twitterUrl?.trim() || null,
    pixiv_url: data.pixivUrl?.trim() || null,
    misskey_url: data.misskeyUrl?.trim() || null,
  }

  if (existing) {
    const { error } = await supabase
      .from('creator_profiles')
      .update(payload)
      .eq('user_id', user.id)
    if (error) return { error: `更新に失敗しました: ${error.message}` }
  } else {
    const { error } = await supabase
      .from('creator_profiles')
      .insert(payload)
    if (error) return { error: `作成に失敗しました: ${error.message}` }
  }

  return { success: true }
}

export async function toggleCreatorStatus(): Promise<{ error: string } | { success: true; status: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('status')
    .eq('user_id', user.id)
    .single()

  if (!cp) return { error: 'クリエイタープロフィールが見つかりません' }

  const newStatus = cp.status === '受付中' ? '停止中' : '受付中'
  const { error } = await supabase
    .from('creator_profiles')
    .update({ status: newStatus })
    .eq('user_id', user.id)

  if (error) return { error: `更新に失敗しました: ${error.message}` }

  // 受付開始時：お気に入り登録者に通知
  if (newStatus === '受付中') {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('creator_id', user.id)

    if (favorites && favorites.length > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single()

      for (const fav of favorites) {
        createNotification({
          userId: fav.user_id,
          type: 'favorite_available',
          title: `${profile?.username || 'クリエイター'}さんが受付を開始しました`,
          body: '今なら依頼を送れます',
          relatedId: user.id,
        })
      }
    }
  }

  return { success: true, status: newStatus }
}
