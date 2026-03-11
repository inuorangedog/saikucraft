'use server'

import { createClient } from '@/app/lib/supabase-server'

/** クリエイターの返信平均日数を算出 */
export async function getCreatorReplyDays(userId: string): Promise<number | null> {
  const supabase = await createClient()

  // クリエイターとして参加している取引のメッセージを取得
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, client_id, creator_id')
    .eq('creator_id', userId)

  if (!transactions || transactions.length === 0) return null

  const txIds = transactions.map((t) => t.id)

  // 各取引のメッセージを取得（送信日時順）
  const { data: messages } = await supabase
    .from('messages')
    .select('transaction_id, sender_id, created_at')
    .in('transaction_id', txIds)
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) return null

  // クライアントからのメッセージに対するクリエイターの返信時間を計算
  const replyTimes: number[] = []
  const txMap = new Map(transactions.map((t) => [t.id, t]))

  // 取引ごとにグループ化
  const msgsByTx = new Map<string, typeof messages>()
  for (const msg of messages) {
    const arr = msgsByTx.get(msg.transaction_id) || []
    arr.push(msg)
    msgsByTx.set(msg.transaction_id, arr)
  }

  for (const [txId, txMsgs] of msgsByTx) {
    const tx = txMap.get(txId)
    if (!tx) continue

    let lastClientMsgTime: Date | null = null
    for (const msg of txMsgs) {
      if (msg.sender_id === tx.client_id) {
        lastClientMsgTime = new Date(msg.created_at)
      } else if (msg.sender_id === tx.creator_id && lastClientMsgTime) {
        const diffMs = new Date(msg.created_at).getTime() - lastClientMsgTime.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        if (diffDays < 30) { // 30日以上は異常値として除外
          replyTimes.push(diffDays)
        }
        lastClientMsgTime = null
      }
    }
  }

  if (replyTimes.length === 0) return null

  const avg = replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length
  return Math.round(avg * 10) / 10 // 小数点1桁
}

/** 依頼者の返信平均日数を算出 */
export async function getClientReplyDays(userId: string): Promise<number | null> {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, client_id, creator_id')
    .eq('client_id', userId)

  if (!transactions || transactions.length === 0) return null

  const txIds = transactions.map((t) => t.id)

  const { data: messages } = await supabase
    .from('messages')
    .select('transaction_id, sender_id, created_at')
    .in('transaction_id', txIds)
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) return null

  const replyTimes: number[] = []
  const txMap = new Map(transactions.map((t) => [t.id, t]))

  const msgsByTx = new Map<string, typeof messages>()
  for (const msg of messages) {
    const arr = msgsByTx.get(msg.transaction_id) || []
    arr.push(msg)
    msgsByTx.set(msg.transaction_id, arr)
  }

  for (const [txId, txMsgs] of msgsByTx) {
    const tx = txMap.get(txId)
    if (!tx) continue

    let lastCreatorMsgTime: Date | null = null
    for (const msg of txMsgs) {
      if (msg.sender_id === tx.creator_id) {
        lastCreatorMsgTime = new Date(msg.created_at)
      } else if (msg.sender_id === tx.client_id && lastCreatorMsgTime) {
        const diffMs = new Date(msg.created_at).getTime() - lastCreatorMsgTime.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        if (diffDays < 30) {
          replyTimes.push(diffDays)
        }
        lastCreatorMsgTime = null
      }
    }
  }

  if (replyTimes.length === 0) return null

  const avg = replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length
  return Math.round(avg * 10) / 10
}

/** 依頼者の統計情報を取得 */
export async function getClientStats(userId: string) {
  const supabase = await createClient()

  // 総依頼件数
  const { count: totalOrders } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', userId)

  // キャンセル件数
  const { count: cancelledOrders } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', userId)
    .eq('status', 'キャンセル')

  const total = totalOrders ?? 0
  const cancelled = cancelledOrders ?? 0
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0

  // BOOST送信回数
  const { count: boostSent } = await supabase
    .from('boosts')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', userId)

  // 返信平均日数
  const replyDays = await getClientReplyDays(userId)

  return {
    totalOrders: total,
    cancelRate,
    boostSent: boostSent ?? 0,
    replyDays,
  }
}
