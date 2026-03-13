'use server'

import { createClient } from '@/app/lib/supabase-server'
import { refundPayment } from './payment-actions'
import { createNotification } from '@/app/lib/notifications'

// 段階的キャンセルポリシー
// 取引開始〜ラフ提出前：全額返金（100%）
// ラフ提出後〜詳細ラフ承認前：50%返金
// 詳細ラフ承認後：返金なし（0%）

function getRefundPercent(status: string): number {
  switch (status) {
    case '取引開始':
    case 'ラフ提出待ち':
      return 100
    case 'ラフ確認中':
    case '詳細ラフ提出待ち':
    case '詳細ラフ確認中':
      return 50
    case '着手済み':
    case '完成品制作中':
    case '完成品確認中':
    case '納品・検収':
      return 0
    default:
      return 0
  }
}

function getRefundLabel(percent: number): string {
  if (percent === 100) return '全額返金'
  if (percent === 50) return '50%返金'
  return '返金なし'
}

export async function cancelTransaction(
  transactionId: string
): Promise<{ error: string } | { success: true; refundPercent: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, status, creator_id, client_id, payment_status')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: '取引が見つかりません' }
  if (tx.client_id !== user.id) return { error: '依頼者のみがキャンセルできます' }
  if (tx.status === '完了' || tx.status === '異議申し立て中') {
    return { error: 'この取引はキャンセルできません' }
  }

  const refundPercent = getRefundPercent(tx.status)

  // 仮払い済みの場合は返金処理
  if (tx.payment_status === 'paid' && refundPercent > 0) {
    const refundResult = await refundPayment(transactionId, refundPercent)
    if ('error' in refundResult) return refundResult
  }

  // ステータス更新
  const newPaymentStatus = refundPercent === 100 ? 'refunded'
    : refundPercent === 50 ? 'partially_refunded'
    : tx.payment_status

  await supabase
    .from('transactions')
    .update({
      status: '完了',
      payment_status: tx.payment_status === 'paid' ? newPaymentStatus : tx.payment_status,
    })
    .eq('id', transactionId)

  // ユーザー名を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  const label = getRefundLabel(refundPercent)

  // クリエイターに通知
  createNotification({
    userId: tx.creator_id,
    type: 'status_change',
    title: '取引がキャンセルされました',
    body: `${profile?.username || '依頼者'}さんが取引をキャンセルしました（${label}）`,
    relatedId: transactionId,
  })

  return { success: true, refundPercent }
}

// キャンセル前の確認情報を返す
export async function getCancelInfo(
  transactionId: string
): Promise<{ error: string } | { refundPercent: number; refundLabel: string; amount: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: tx } = await supabase
    .from('transactions')
    .select('status, amount, client_id')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: '取引が見つかりません' }
  if (tx.client_id !== user.id) return { error: '権限がありません' }

  const refundPercent = getRefundPercent(tx.status)
  return {
    refundPercent,
    refundLabel: getRefundLabel(refundPercent),
    amount: tx.amount,
  }
}
