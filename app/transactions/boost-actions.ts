'use server'

import { createClient } from '@/app/lib/supabase-server'
import { stripe, PLATFORM_FEE_PERCENT } from '@/app/lib/stripe'
import { createNotification } from '@/app/lib/notifications'

export async function sendBoost(
  transactionId: string,
  amount: number,
  message?: string
): Promise<{ error: string } | { clientSecret: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '認証されていません' }

    // バリデーション
    if (amount < 500) return { error: '最低BOOST額は¥500です' }
    if (amount > 50000) return { error: '最大BOOST額は¥50,000です' }
    if (amount % 100 !== 0) return { error: '100円単位で指定してください' }

    // 取引を確認
    const { data: tx } = await supabase
      .from('transactions')
      .select('id, status, amount, client_id, creator_id')
      .eq('id', transactionId)
      .single()

    if (!tx) return { error: '取引が見つかりません' }
    if (tx.status !== '完了') return { error: '完了した取引のみBOOSTできます' }
    if (tx.client_id !== user.id) return { error: '依頼者のみBOOSTできます' }

    // 上限チェック（取引額×3倍）
    const maxBoost = Math.min(tx.amount * 3, 50000)
    if (amount > maxBoost) {
      return { error: `この取引のBOOST上限は¥${maxBoost.toLocaleString()}です` }
    }

    // 既にBOOST済みか確認
    const { data: existingBoost } = await supabase
      .from('boosts')
      .select('id')
      .eq('transaction_id', transactionId)
      .eq('sender_id', user.id)
      .single()

    if (existingBoost) return { error: 'この取引では既にBOOSTしています' }

    // PaymentIntent作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'jpy',
      metadata: {
        type: 'boost',
        transaction_id: tx.id,
        sender_id: user.id,
        receiver_id: tx.creator_id,
        ...(message ? { boost_message: message.slice(0, 500) } : {}),
      },
    })

    return { clientSecret: paymentIntent.client_secret! }
  } catch (e) {
    console.error('Boost PaymentIntent error:', e)
    return { error: 'BOOSTの準備に失敗しました' }
  }
}

// Webhook から呼ばれる：BOOST決済完了後の処理
export async function completeBoost({
  transactionId,
  senderId,
  receiverId,
  amount,
  message,
}: {
  transactionId: string
  senderId: string
  receiverId: string
  amount: number
  message?: string
}) {
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // BOOSTレコード作成
  await supabase.from('boosts').insert({
    transaction_id: transactionId,
    sender_id: senderId,
    receiver_id: receiverId,
    amount,
    ...(message ? { message } : {}),
  })

  // クリエイターのStripeアカウントに送金（手数料7%控除）
  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('stripe_account_id, stripe_onboarded')
    .eq('user_id', receiverId)
    .single()

  if (cp?.stripe_account_id && cp.stripe_onboarded) {
    const fee = Math.ceil(amount * PLATFORM_FEE_PERCENT / 100)
    const transferAmount = amount - fee

    await stripe.transfers.create({
      amount: transferAmount,
      currency: 'jpy',
      destination: cp.stripe_account_id,
      metadata: {
        type: 'boost',
        transaction_id: transactionId,
      },
    })
  }

  // 通知
  await createNotification({
    userId: receiverId,
    type: 'boost_received',
    title: `¥${amount.toLocaleString()}のBOOSTを受け取りました！`,
    body: message || undefined,
    relatedId: transactionId,
  })
}
