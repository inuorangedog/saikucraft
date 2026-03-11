'use server'

import { createClient } from '@/app/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** 退会前チェック: 進行中の取引があるか確認 */
export async function checkCanWithdraw(): Promise<{
  canWithdraw: boolean
  activeTransactionCount: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { canWithdraw: false, activeTransactionCount: 0 }

  const activeStatuses = ['取引開始', 'ラフ提出待ち', 'ラフ確認中', '詳細ラフ確認中', '着手済み', '納品済み']

  // クリエイターとして進行中
  const { count: creatorActive } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', user.id)
    .in('status', activeStatuses)

  // クライアントとして進行中
  const { count: clientActive } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', user.id)
    .in('status', activeStatuses)

  const total = (creatorActive ?? 0) + (clientActive ?? 0)
  return { canWithdraw: total === 0, activeTransactionCount: total }
}

/** 退会処理 */
export async function withdrawAccount(): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // 再度チェック
  const { canWithdraw, activeTransactionCount } = await checkCanWithdraw()
  if (!canWithdraw) {
    return { error: `進行中の取引が${activeTransactionCount}件あるため退会できません。取引を完了またはキャンセルしてください。` }
  }

  const adminSupabase = getAdminSupabase()

  // 1. プロフィールを論理削除 + ユーザー名匿名化
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      username: '退会済みユーザー',
      avatar_url: null,
    })
    .eq('user_id', user.id)

  if (profileError) return { error: `退会処理に失敗しました: ${profileError.message}` }

  // 2. クリエイタープロフィールを停止
  await adminSupabase
    .from('creator_profiles')
    .update({ status: '停止中', bio: null })
    .eq('user_id', user.id)

  // 3. ポートフォリオを削除
  await adminSupabase
    .from('portfolios')
    .delete()
    .eq('user_id', user.id)

  // 4. 募集を締め切り
  await adminSupabase
    .from('listings')
    .update({ status: '締切' })
    .eq('client_id', user.id)
    .eq('status', '募集中')

  // 5. お気に入りを削除
  await adminSupabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)

  // 6. イベント紐付けを削除
  await adminSupabase
    .from('user_events')
    .delete()
    .eq('user_id', user.id)

  // 7. タグ紐付けを削除
  const { data: cp } = await adminSupabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (cp) {
    await adminSupabase
      .from('creator_tags')
      .delete()
      .eq('creator_id', cp.id)
  }

  // 8. Supabase Auth のユーザーを無効化（サインアウト強制）
  // ※ 物理削除はせず、ログインできないようにするだけ
  // auth.admin.updateUserById でメール変更 + ban
  await adminSupabase.auth.admin.updateUserById(user.id, {
    ban_duration: '876000h', // ~100年
  })

  return { success: true }
}
