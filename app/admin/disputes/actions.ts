'use server'

import { createClient } from '@/app/lib/supabase-server'
import { notifyStatusChange } from '@/app/lib/notifications'

export async function resolveDispute(
  transactionId: string,
  resolution: 'refund_full' | 'refund_half' | 'complete' | 'cancel',
  adminNote?: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // 管理者チェック（profilesにis_adminフラグがあると想定、なければ特定UIDで）
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_admin) return { error: '管理者権限がありません' }

  // 取引を取得
  const { data: tx } = await supabase
    .from('transactions')
    .select('id, status, amount, creator_id, client_id, stripe_payment_intent_id, payment_status')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: '取引が見つかりません' }
  if (tx.status !== '異議申し立て中') return { error: 'この取引は異議申し立て中ではありません' }

  let newStatus = '完了'
  let newPaymentStatus = tx.payment_status

  switch (resolution) {
    case 'refund_full':
      // Stripe返金はwebhook経由で処理されるため、ここではステータスのみ更新
      // 実際の返金はStripeダッシュボードから手動で行う
      newStatus = '完了'
      newPaymentStatus = 'refund_pending'
      break
    case 'refund_half':
      newStatus = '完了'
      newPaymentStatus = 'refund_pending'
      break
    case 'complete':
      newStatus = '完了'
      break
    case 'cancel':
      newStatus = '完了'
      break
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      status: newStatus,
      payment_status: newPaymentStatus,
      dispute_resolution: resolution,
      dispute_admin_note: adminNote || null,
      dispute_resolved_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (error) return { error: `更新に失敗しました: ${error.message}` }

  // 両方に通知
  const statusLabel = resolution === 'refund_full' ? '全額返金で解決'
    : resolution === 'refund_half' ? '50%返金で解決'
    : resolution === 'complete' ? '取引完了で解決'
    : 'キャンセルで解決'

  notifyStatusChange({
    transactionId,
    targetUserId: tx.client_id,
    newStatus: `異議解決: ${statusLabel}`,
    actorName: '管理者',
  })

  notifyStatusChange({
    transactionId,
    targetUserId: tx.creator_id,
    newStatus: `異議解決: ${statusLabel}`,
    actorName: '管理者',
  })

  return { success: true }
}
