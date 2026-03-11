'use server'

import { createClient } from '@/app/lib/supabase-server'
import { transferToCreator } from './payment-actions'
import { notifyStatusChange, notifyNewMessage, notifyDispute } from '@/app/lib/notifications'

const STATUS_FLOW: Record<string, string[]> = {
  '取引開始': ['ラフ提出待ち'],
  'ラフ提出待ち': ['ラフ確認中'],
  'ラフ確認中': ['詳細ラフ確認中', 'ラフ提出待ち'],
  '詳細ラフ確認中': ['着手済み', 'ラフ確認中'],
  '着手済み': ['納品済み'],
  '納品済み': ['完了'],
  '完了': [],
  '異議申し立て中': [],
}

export async function updateTransactionStatus(
  transactionId: string,
  newStatus: string,
  deliveryFile?: { url: string; fileName: string; key: string }
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // 取引を取得
  const { data: tx } = await supabase
    .from('transactions')
    .select('id, status, creator_id, client_id, max_revisions, revision_count')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: '取引が見つかりません' }
  if (tx.creator_id !== user.id && tx.client_id !== user.id) {
    return { error: 'この取引にアクセスする権限がありません' }
  }

  // ステータス遷移の検証
  const allowed = STATUS_FLOW[tx.status] || []
  if (!allowed.includes(newStatus)) {
    return { error: `${tx.status}から${newStatus}への変更はできません` }
  }

  // 権限チェック
  const isCreator = tx.creator_id === user.id
  const isClient = tx.client_id === user.id

  // クリエイターのアクション
  if (['ラフ確認中', '納品済み'].includes(newStatus) && !isCreator) {
    return { error: 'クリエイターのみが実行できます' }
  }
  // 依頼者のアクション
  if (['詳細ラフ確認中', '着手済み', '完了'].includes(newStatus) && !isClient) {
    return { error: '依頼者のみが実行できます' }
  }
  // 修正依頼（ラフ提出待ちに戻す）は依頼者
  if (newStatus === 'ラフ提出待ち' && tx.status === 'ラフ確認中' && !isClient) {
    return { error: '依頼者のみが修正を依頼できます' }
  }

  const updatePayload: Record<string, unknown> = { status: newStatus }

  // 修正回数カウント
  if (newStatus === 'ラフ提出待ち' && tx.status === 'ラフ確認中') {
    updatePayload.revision_count = tx.revision_count + 1
  }

  // 納品時刻 + 納品ファイル
  if (newStatus === '納品済み') {
    const now = new Date()
    updatePayload.delivered_at = now.toISOString()
    updatePayload.auto_approve_at = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    if (deliveryFile) {
      updatePayload.delivery_file_url = deliveryFile.url
      updatePayload.delivery_file_name = deliveryFile.fileName
      updatePayload.delivery_file_key = deliveryFile.key
    }
  }

  const { error } = await supabase
    .from('transactions')
    .update(updatePayload)
    .eq('id', transactionId)

  if (error) return { error: `更新に失敗しました: ${error.message}` }

  // 通知を送信（相手方へ）
  const targetUserId = isCreator ? tx.client_id : tx.creator_id
  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  notifyStatusChange({
    transactionId,
    targetUserId,
    newStatus,
    actorName: actorProfile?.username || '不明',
  })

  // 完了時にクリエイターへ送金
  if (newStatus === '完了') {
    const transferResult = await transferToCreator(transactionId)
    if ('error' in transferResult) {
      console.error('Transfer failed:', transferResult.error)
      // 送金失敗してもステータスは完了のまま（管理者が手動対応）
    }
  }

  return { success: true }
}

export async function sendMessage(
  transactionId: string,
  content: string | null,
  imageUrls?: string[] | null
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  if (!content?.trim() && (!imageUrls || imageUrls.length === 0)) {
    return { error: 'メッセージまたは画像を入力してください' }
  }

  if (imageUrls && imageUrls.length > 3) {
    return { error: '画像は1メッセージにつき3枚までです' }
  }

  // 取引の当事者か確認
  const { data: tx } = await supabase
    .from('transactions')
    .select('creator_id, client_id')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: '取引が見つかりません' }
  if (tx.creator_id !== user.id && tx.client_id !== user.id) {
    return { error: 'この取引にアクセスする権限がありません' }
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      transaction_id: transactionId,
      sender_id: user.id,
      content: content?.trim() || null,
      image_urls: imageUrls && imageUrls.length > 0 ? imageUrls : null,
    })

  if (error) return { error: `送信に失敗しました: ${error.message}` }

  // 相手方に通知
  const recipientId = tx.creator_id === user.id ? tx.client_id : tx.creator_id
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  notifyNewMessage({
    transactionId,
    targetUserId: recipientId,
    senderName: senderProfile?.username || '不明',
  })

  return { success: true }
}

export async function fileDispute(
  transactionId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: tx } = await supabase
    .from('transactions')
    .select('status, client_id, creator_id')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: '取引が見つかりません' }
  if (tx.client_id !== user.id) return { error: '依頼者のみが異議申し立てできます' }
  if (tx.status === '完了' || tx.status === '異議申し立て中') {
    return { error: 'この取引には異議申し立てできません' }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ status: '異議申し立て中' })
    .eq('id', transactionId)

  if (error) return { error: `更新に失敗しました: ${error.message}` }

  // クリエイターに通知
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  notifyDispute({
    transactionId,
    targetUserId: tx.creator_id,
    clientName: clientProfile?.username || '不明',
  })

  return { success: true }
}
