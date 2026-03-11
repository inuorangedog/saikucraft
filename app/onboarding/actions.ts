'use server'

import { createClient } from '@/app/lib/supabase-server'

export type OnboardingData = {
  username: string
  isAgeVerified: boolean
  isHumanVerified: boolean
  userType: 'client' | 'creator' | 'both'
  creatorBio: string
  creatorStatus: '受付中' | '停止中'
  callOk: '不可' | '可' | '要相談'
  clientBio: string
}

export async function checkUsername(username: string): Promise<{ available: boolean }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  return { available: !data }
}

export async function completeOnboarding(data: OnboardingData): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '認証されていません' }
  }

  // バリデーション
  if (!data.username.trim()) {
    return { error: 'ユーザー名を入力してください' }
  }
  if (!data.isAgeVerified) {
    return { error: '18歳以上であることを確認してください' }
  }
  if (!data.isHumanVerified) {
    return { error: '人間制作の申告が必要です' }
  }

  // ユーザー名の重複チェック
  const { available } = await checkUsername(data.username)
  if (!available) {
    return { error: 'このユーザー名は既に使われています' }
  }

  // profiles 挿入
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      username: data.username.trim(),
      user_type: data.userType,
      is_age_verified: data.isAgeVerified,
      is_human_verified: data.isHumanVerified,
    })

  if (profileError) {
    console.error('profiles insert error:', profileError)
    return { error: `プロフィールの作成に失敗しました: ${profileError.message}` }
  }

  // クリエイタープロフィール挿入
  if (data.userType === 'creator' || data.userType === 'both') {
    const { error: creatorError } = await supabase
      .from('creator_profiles')
      .insert({
        user_id: user.id,
        bio: data.creatorBio || null,
        status: data.creatorStatus,
        call_ok: data.callOk,
      })

    if (creatorError) {
      console.error('creator_profiles insert error:', creatorError)
      return { error: `クリエイタープロフィールの作成に失敗しました: ${creatorError.message}` }
    }
  }

  return { success: true }
}
