'use server'

import { createClient } from '@/app/lib/supabase-server'
import { createNotification } from '@/app/lib/notifications'

// 指名依頼を送信
export async function createNegotiation(data: {
  creatorId: string
  title: string
  description: string
  budget: number | null
  deadline: string | null
  wantsCopyrightTransfer?: boolean
  wantsPortfolioBan?: boolean
  wantsCommercialUse?: boolean
}): Promise<{ error: string } | { negotiationId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }
  if (user.id === data.creatorId) return { error: '自分に依頼することはできません' }

  // ブロックチェック
  const { data: blocked } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', data.creatorId)
    .eq('blocked_id', user.id)
    .single()
  if (blocked) return { error: 'このクリエイターには依頼できません' }

  // クールダウンチェック
  const { data: cooldown } = await supabase
    .from('negotiation_cooldowns')
    .select('available_at')
    .eq('client_id', user.id)
    .eq('creator_id', data.creatorId)
    .gte('available_at', new Date().toISOString())
    .single()
  if (cooldown) {
    const availableDate = new Date(cooldown.available_at).toLocaleDateString('ja-JP')
    return { error: `${availableDate}以降に再度依頼できます` }
  }

  // クリエイターの受付状態チェック
  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('status')
    .eq('user_id', data.creatorId)
    .single()
  if (!cp || cp.status !== '受付中') return { error: 'このクリエイターは現在受付停止中です' }

  const { data: negotiation, error } = await supabase
    .from('negotiations')
    .insert({
      creator_id: data.creatorId,
      client_id: user.id,
      title: data.title,
      description: data.description || null,
      budget: data.budget || null,
      deadline: data.deadline || null,
      wants_copyright_transfer: data.wantsCopyrightTransfer ?? false,
      wants_portfolio_ban: data.wantsPortfolioBan ?? false,
      wants_commercial_use: data.wantsCommercialUse ?? false,
    })
    .select('id')
    .single()

  if (error) return { error: `依頼の送信に失敗しました: ${error.message}` }

  // クリエイターに通知
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  createNotification({
    userId: data.creatorId,
    type: 'status_change',
    title: `${profile?.username || '依頼者'}さんから指名依頼が届きました`,
    body: data.title,
    relatedId: negotiation.id,
  })

  return { negotiationId: negotiation.id }
}

// 交渉メッセージを送信
export async function sendNegotiationMessage(
  negotiationId: string,
  data: {
    message: string
    proposedBudget: number | null
    proposedDeadline: string | null
  }
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  if (!data.message.trim()) return { error: 'メッセージを入力してください' }

  const { data: neg } = await supabase
    .from('negotiations')
    .select('creator_id, client_id, status')
    .eq('id', negotiationId)
    .single()

  if (!neg) return { error: '交渉が見つかりません' }
  if (neg.creator_id !== user.id && neg.client_id !== user.id) {
    return { error: 'この交渉にアクセスする権限がありません' }
  }
  if (neg.status !== '交渉中') return { error: 'この交渉は既に終了しています' }

  const { error } = await supabase.from('negotiation_messages').insert({
    negotiation_id: negotiationId,
    sender_id: user.id,
    message: data.message.trim(),
    proposed_budget: data.proposedBudget || null,
    proposed_deadline: data.proposedDeadline || null,
  })

  if (error) return { error: `送信に失敗しました: ${error.message}` }

  // 相手に通知
  const targetId = neg.creator_id === user.id ? neg.client_id : neg.creator_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  createNotification({
    userId: targetId,
    type: 'message',
    title: `${profile?.username || '不明'}さんから交渉メッセージが届きました`,
    relatedId: negotiationId,
  })

  return { success: true }
}

// 交渉ステータスを更新（承諾/辞退/キャンセル）
export async function updateNegotiationStatus(
  negotiationId: string,
  newStatus: '合意済み' | '辞退' | 'キャンセル'
): Promise<{ error: string } | { success: true; transactionId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: neg } = await supabase
    .from('negotiations')
    .select('id, creator_id, client_id, title, description, budget, deadline, status, wants_copyright_transfer, wants_portfolio_ban, wants_commercial_use')
    .eq('id', negotiationId)
    .single()

  if (!neg) return { error: '交渉が見つかりません' }
  if (neg.status !== '交渉中') return { error: 'この交渉は既に終了しています' }

  const isCreator = neg.creator_id === user.id
  const isClient = neg.client_id === user.id
  if (!isCreator && !isClient) return { error: 'アクセス権限がありません' }

  // 権限チェック
  if (newStatus === '辞退' && !isCreator) return { error: 'クリエイターのみが辞退できます' }
  if (newStatus === 'キャンセル' && !isClient) return { error: '依頼者のみがキャンセルできます' }

  const { error: updateError } = await supabase
    .from('negotiations')
    .update({ status: newStatus })
    .eq('id', negotiationId)

  if (updateError) return { error: updateError.message }

  // 辞退時：クールダウン設定（3日間）
  if (newStatus === '辞退') {
    await supabase.from('negotiation_cooldowns').insert({
      client_id: neg.client_id,
      creator_id: neg.creator_id,
      available_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  // 合意時：取引を作成
  let transactionId: string | undefined
  if (newStatus === '合意済み') {
    // 最新の交渉メッセージから予算と納期を取得
    const { data: lastMsg } = await supabase
      .from('negotiation_messages')
      .select('proposed_budget, proposed_deadline')
      .eq('negotiation_id', negotiationId)
      .not('proposed_budget', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const finalBudget = lastMsg?.proposed_budget || neg.budget
    const finalDeadline = lastMsg?.proposed_deadline || neg.deadline

    if (!finalBudget) return { error: '予算が設定されていません。交渉メッセージで予算を提案してください' }

    // クリエイターの修正回数設定を取得
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('default_max_rough_revisions, default_max_detailed_revisions, default_max_final_revisions')
      .eq('user_id', neg.creator_id)
      .single()

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        negotiation_id: neg.id,
        creator_id: neg.creator_id,
        client_id: neg.client_id,
        amount: finalBudget,
        deadline: finalDeadline || null,
        wants_copyright_transfer: neg.wants_copyright_transfer ?? false,
        wants_portfolio_ban: neg.wants_portfolio_ban ?? false,
        wants_commercial_use: neg.wants_commercial_use ?? false,
        max_revisions: creatorProfile?.default_max_rough_revisions ?? 3,
        max_detailed_revisions: creatorProfile?.default_max_detailed_revisions ?? 2,
        max_final_revisions: creatorProfile?.default_max_final_revisions ?? 2,
      })
      .select('id')
      .single()

    if (txError) return { error: `取引の作成に失敗しました: ${txError.message}` }
    transactionId = tx.id
  }

  // 通知
  const targetId = isCreator ? neg.client_id : neg.creator_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  const statusMessages: Record<string, string> = {
    '合意済み': '交渉が合意に達しました。仮払いに進んでください',
    '辞退': `${profile?.username || 'クリエイター'}さんが依頼を辞退しました`,
    'キャンセル': `${profile?.username || '依頼者'}さんが依頼をキャンセルしました`,
  }

  createNotification({
    userId: targetId,
    type: 'status_change',
    title: statusMessages[newStatus],
    relatedId: transactionId || negotiationId,
  })

  return { success: true, transactionId }
}
