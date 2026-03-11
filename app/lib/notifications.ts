import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './resend'

// Service Role Keyで通知を作成（RLSバイパス）
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type NotificationType = 'message' | 'status_change' | 'favorite_available' | 'boost_received' | 'dispute'

export async function createNotification({
  userId,
  type,
  title,
  body,
  relatedId,
}: {
  userId: string
  type: NotificationType
  title: string
  body?: string
  relatedId?: string
}) {
  const supabase = getAdminClient()

  // 通知設定を確認
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  // サイト内通知がOFFならスキップ
  const siteKey = `${type}_site` as keyof typeof settings
  if (settings && settings[siteKey] === false) return

  // サイト内通知を作成
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body: body || null,
    related_id: relatedId || null,
  })

  // メール通知
  const emailKey = `${type}_email` as keyof typeof settings
  if (settings && settings[emailKey] === false) return

  // ユーザーのメールアドレスを取得
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
  if (!user?.email) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const notificationUrl = relatedId
    ? (type === 'message' || type === 'status_change' || type === 'dispute')
      ? `${appUrl}/transactions/${relatedId}`
      : `${appUrl}/dashboard/notifications`
    : `${appUrl}/dashboard/notifications`

  sendEmail({
    to: user.email,
    subject: `[SaikuCraft] ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">${title}</h2>
        ${body ? `<p style="color: #525252;">${body}</p>` : ''}
        <a href="${notificationUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #ea580c; color: white; text-decoration: none; border-radius: 8px;">
          確認する
        </a>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #e4e4e7;" />
        <p style="color: #a1a1aa; font-size: 12px;">
          このメールはSaikuCraftから自動送信されています。
          <a href="${appUrl}/dashboard/notifications/settings" style="color: #a1a1aa;">通知設定を変更</a>
        </p>
      </div>
    `,
  })
}

// 取引ステータス変更通知
export async function notifyStatusChange({
  transactionId,
  targetUserId,
  newStatus,
  actorName,
}: {
  transactionId: string
  targetUserId: string
  newStatus: string
  actorName: string
}) {
  await createNotification({
    userId: targetUserId,
    type: 'status_change',
    title: `取引のステータスが「${newStatus}」に変更されました`,
    body: `${actorName}さんがステータスを更新しました`,
    relatedId: transactionId,
  })
}

// メッセージ通知
export async function notifyNewMessage({
  transactionId,
  targetUserId,
  senderName,
}: {
  transactionId: string
  targetUserId: string
  senderName: string
}) {
  await createNotification({
    userId: targetUserId,
    type: 'message',
    title: `${senderName}さんからメッセージが届きました`,
    relatedId: transactionId,
  })
}

// 異議申し立て通知
export async function notifyDispute({
  transactionId,
  targetUserId,
  clientName,
}: {
  transactionId: string
  targetUserId: string
  clientName: string
}) {
  await createNotification({
    userId: targetUserId,
    type: 'dispute',
    title: '異議申し立てが提出されました',
    body: `${clientName}さんが異議申し立てを行いました`,
    relatedId: transactionId,
  })
}
