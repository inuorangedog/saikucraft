'use server'

import { createClient } from '@/app/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createNotification } from '@/app/lib/notifications'
import { sendEmail } from '@/app/lib/resend'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function submitReport(data: {
  targetType: string
  targetId: string
  reason: string
  detail: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type: data.targetType,
      target_id: data.targetId,
      reason: data.reason,
      detail: data.detail || null,
    })

  if (error) return { error: `通報に失敗しました: ${error.message}` }

  // 通報者に受付メールを送信
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (authUser?.email) {
    sendEmail({
      to: authUser.email,
      subject: '【SaikuCraft】通報を受け付けました',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #f97316;">SaikuCraft</h2>
          <p>通報を受け付けました。ご協力ありがとうございます。</p>
          <p>運営チームが内容を確認し、必要に応じて対応いたします。</p>
          <p style="color: #666; font-size: 14px;">※ 対象ユーザーに通報者の情報が通知されることはありません。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">SaikuCraft - 手描きクリエイターと安心して繋がれるコミッションサービス</p>
        </div>
      `,
    })
  }

  // 同じ対象への通報件数をカウント（エスカレーション処理）
  const adminClient = getAdminClient()
  const { count: reportCount } = await adminClient
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('target_id', data.targetId)
    .eq('target_type', data.targetType)

  const total = reportCount ?? 0

  // 3件: 管理者に通知
  if (total === 3) {
    // 管理者ユーザーを取得して通知
    const { data: admins } = await adminClient
      .from('profiles')
      .select('user_id')
      .eq('role', 'admin')

    for (const admin of admins || []) {
      createNotification({
        userId: admin.user_id,
        type: 'dispute',
        title: '通報が3件に達しました',
        body: `${data.targetType} (${data.targetId.slice(0, 8)}...) への通報が3件です。確認してください。`,
        relatedId: data.targetId,
      })
    }
  }

  // 5件: 対象ユーザーにPSD提出要求
  if (total === 5 && data.targetType === 'profile') {
    createNotification({
      userId: data.targetId,
      type: 'dispute',
      title: 'PSDデータまたは制作動画の提出をお願いします',
      body: '複数の通報が寄せられたため、作品が人間の手で制作されたことを証明する資料の提出をお願いします。support@saikucraft.com までご連絡ください。',
    })
  }

  return { success: true }
}
