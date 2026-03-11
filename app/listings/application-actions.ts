'use server'

import { createClient } from '@/app/lib/supabase-server'
import { createNotification } from '@/app/lib/notifications'

// クリエイターが募集に応募
export async function applyToListing(
  listingId: string,
  data: {
    message: string
    portfolioUrl: string | null
  }
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // クリエイタープロフィールがあるか確認
  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!cp) return { error: 'クリエイターとして登録されていません' }

  // 募集情報を確認
  const { data: listing } = await supabase
    .from('listings')
    .select('id, client_id, title, status')
    .eq('id', listingId)
    .single()
  if (!listing) return { error: '募集が見つかりません' }
  if (listing.status !== '募集中') return { error: 'この募集は受付を終了しています' }
  if (listing.client_id === user.id) return { error: '自分の募集には応募できません' }
  if (!data.message.trim()) return { error: 'メッセージを入力してください' }

  const { error } = await supabase.from('listing_applications').insert({
    listing_id: listingId,
    creator_id: user.id,
    message: data.message.trim() || null,
    portfolio_url: data.portfolioUrl || null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'この募集には既に応募しています' }
    return { error: `応募に失敗しました: ${error.message}` }
  }

  // 依頼者に通知
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  createNotification({
    userId: listing.client_id,
    type: 'status_change',
    title: `${profile?.username || 'クリエイター'}さんが「${listing.title}」に応募しました`,
    relatedId: listingId,
  })

  return { success: true }
}

// 依頼者が応募者を採用 → 取引を作成
export async function acceptApplication(
  applicationId: string
): Promise<{ error: string } | { transactionId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: app } = await supabase
    .from('listing_applications')
    .select('id, listing_id, creator_id, status')
    .eq('id', applicationId)
    .single()
  if (!app) return { error: '応募が見つかりません' }
  if (app.status !== '応募中') return { error: 'この応募は既に処理済みです' }

  // 募集の所有者か確認
  const { data: listing } = await supabase
    .from('listings')
    .select('id, client_id, budget, deadline, title')
    .eq('id', app.listing_id)
    .single()
  if (!listing) return { error: '募集が見つかりません' }
  if (listing.client_id !== user.id) return { error: 'この募集の依頼者のみが操作できます' }

  const amount = listing.budget
  if (amount === null || amount === undefined) return { error: '予算が設定されていません' }

  // 応募を採用に更新
  await supabase
    .from('listing_applications')
    .update({ status: '採用' })
    .eq('id', applicationId)

  // 取引を作成
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      listing_id: listing.id,
      creator_id: app.creator_id,
      client_id: user.id,
      amount,
      deadline: listing.deadline || null,
    })
    .select('id')
    .single()

  if (txError) return { error: `取引の作成に失敗しました: ${txError.message}` }

  // クリエイターに通知
  createNotification({
    userId: app.creator_id,
    type: 'status_change',
    title: `「${listing.title}」の応募が採用されました！`,
    body: '取引画面から仮払いを待ちましょう',
    relatedId: tx.id,
  })

  return { transactionId: tx.id }
}

// 依頼者が応募者を不採用
export async function rejectApplication(
  applicationId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: app } = await supabase
    .from('listing_applications')
    .select('id, listing_id, creator_id, status')
    .eq('id', applicationId)
    .single()
  if (!app) return { error: '応募が見つかりません' }
  if (app.status !== '応募中') return { error: 'この応募は既に処理済みです' }

  const { data: listing } = await supabase
    .from('listings')
    .select('client_id, title')
    .eq('id', app.listing_id)
    .single()
  if (!listing || listing.client_id !== user.id) return { error: '権限がありません' }

  await supabase
    .from('listing_applications')
    .update({ status: '不採用' })
    .eq('id', applicationId)

  createNotification({
    userId: app.creator_id,
    type: 'status_change',
    title: `「${listing.title}」の応募結果のお知らせ`,
    body: '残念ながら今回は見送りとなりました',
    relatedId: app.listing_id,
  })

  return { success: true }
}

// クリエイターが応募を辞退
export async function withdrawApplication(
  applicationId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  const { data: app } = await supabase
    .from('listing_applications')
    .select('id, creator_id, status')
    .eq('id', applicationId)
    .single()
  if (!app) return { error: '応募が見つかりません' }
  if (app.creator_id !== user.id) return { error: '権限がありません' }
  if (app.status !== '応募中') return { error: 'この応募は既に処理済みです' }

  await supabase
    .from('listing_applications')
    .update({ status: '辞退' })
    .eq('id', applicationId)

  return { success: true }
}
