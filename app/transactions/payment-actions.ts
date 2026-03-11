'use server'

import { createClient } from '@/app/lib/supabase-server'
import { stripe, PLATFORM_FEE_PERCENT } from '@/app/lib/stripe'

// 仮払い（PaymentIntent作成）
export async function createPaymentIntent(
  transactionId: string
): Promise<{ error: string } | { clientSecret: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '認証されていません' }

    const { data: tx } = await supabase
      .from('transactions')
      .select('id, amount, client_id, creator_id, stripe_payment_intent_id, payment_status')
      .eq('id', transactionId)
      .single()

    if (!tx) return { error: '取引が見つかりません' }
    if (tx.client_id !== user.id) return { error: '依頼者のみが支払いできます' }
    if (tx.payment_status !== 'unpaid') return { error: '既に支払い済みです' }

    // 既存のPaymentIntentがあればそれを返す
    if (tx.stripe_payment_intent_id) {
      const existing = await stripe.paymentIntents.retrieve(tx.stripe_payment_intent_id)
      if (existing.client_secret) {
        return { clientSecret: existing.client_secret }
      }
    }

    // Stripe Customer を取得 or 作成（銀行振込に必要）
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, username')
      .eq('user_id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: profile?.username || undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // PaymentIntent作成（Separate charges and transfers方式）
    // カード・コンビニ・銀行振込に対応
    const paymentIntent = await stripe.paymentIntents.create({
      amount: tx.amount,
      currency: 'jpy',
      customer: customerId,
      payment_method_types: ['card', 'konbini', 'customer_balance'],
      payment_method_options: {
        konbini: {
          expires_after_days: 3,
        },
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: {
            type: 'jp_bank_transfer',
          },
        },
      },
      metadata: {
        transaction_id: tx.id,
        creator_id: tx.creator_id,
        client_id: tx.client_id,
      },
    })

    // PaymentIntent IDを保存
    await supabase
      .from('transactions')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', transactionId)

    return { clientSecret: paymentIntent.client_secret! }
  } catch (e) {
    console.error('PaymentIntent error:', e)
    return { error: '決済の準備に失敗しました' }
  }
}

// 取引完了時の送金（クリエイターへTransfer）
export async function transferToCreator(
  transactionId: string
): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '認証されていません' }

    const { data: tx } = await supabase
      .from('transactions')
      .select('id, amount, creator_id, client_id, status, payment_status, stripe_payment_intent_id')
      .eq('id', transactionId)
      .single()

    if (!tx) return { error: '取引が見つかりません' }
    if (tx.status !== '完了') return { error: '完了した取引のみ送金できます' }
    if (tx.payment_status !== 'paid') return { error: '仮払いが完了していません' }

    // クリエイターのStripeアカウントを取得
    const { data: cp } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_onboarded')
      .eq('user_id', tx.creator_id)
      .single()

    if (!cp?.stripe_account_id || !cp.stripe_onboarded) {
      return { error: 'クリエイターのStripeアカウントが設定されていません' }
    }

    // 手数料計算（7%）
    const fee = Math.ceil(tx.amount * PLATFORM_FEE_PERCENT / 100)
    const transferAmount = tx.amount - fee

    // Transfer作成
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: 'jpy',
      destination: cp.stripe_account_id,
      source_transaction: tx.stripe_payment_intent_id
        ? (await stripe.paymentIntents.retrieve(tx.stripe_payment_intent_id)).latest_charge as string
        : undefined,
      metadata: {
        transaction_id: tx.id,
        fee_amount: fee.toString(),
      },
    })

    await supabase
      .from('transactions')
      .update({
        payment_status: 'transferred',
        stripe_transfer_id: transfer.id,
      })
      .eq('id', transactionId)

    return { success: true }
  } catch (e) {
    console.error('Transfer error:', e)
    return { error: '送金に失敗しました' }
  }
}

// キャンセル時の返金
export async function refundPayment(
  transactionId: string,
  refundPercent: number // 100 = 全額, 50 = 半額, 0 = 返金なし
): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await createClient()

    // 管理者チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '認証されていません' }

    const { data: tx } = await supabase
      .from('transactions')
      .select('id, amount, stripe_payment_intent_id, payment_status')
      .eq('id', transactionId)
      .single()

    if (!tx) return { error: '取引が見つかりません' }
    if (tx.payment_status !== 'paid') return { error: '仮払いが完了していません' }
    if (!tx.stripe_payment_intent_id) return { error: '決済情報がありません' }
    if (refundPercent <= 0) return { success: true } // 返金なし

    const refundAmount = Math.floor(tx.amount * refundPercent / 100)

    const refund = await stripe.refunds.create({
      payment_intent: tx.stripe_payment_intent_id,
      amount: refundAmount,
      metadata: {
        transaction_id: tx.id,
        refund_percent: refundPercent.toString(),
      },
    })

    await supabase
      .from('transactions')
      .update({
        payment_status: refundPercent === 100 ? 'refunded' : 'partially_refunded',
        stripe_refund_id: refund.id,
      })
      .eq('id', transactionId)

    return { success: true }
  } catch (e) {
    console.error('Refund error:', e)
    return { error: '返金に失敗しました' }
  }
}
